const { NylasConfig } = require("../nylas-config");
const cron = require("node-cron");
const { default: Event } = require("nylas/lib/models/event");
const User = require("../models/userSchema");
const { Scope } = require("nylas/lib/models/connect");
const { default: Draft } = require("nylas/lib/models/draft");
const Sentiment = require('sentiment');
const summarizer = require("node-summarizer").SummarizerManager;

const labelMap = {
  "Inbox": "inbox",
  "Sent Mail": "sent",
  "Trash": "trash",
  "Category Social": "social",
  "Category Updates": "updates",
  "Important": "important",
  "Category Personal": "personal",
  "Spam": "spam",
  "All Mail": "all",
  "Category Promotions": "promotions",
};

const getLabelForKey = (value) => {
  for (const key in labelMap) {
    if (labelMap.hasOwnProperty(key) && labelMap[key] === value) {
      return key;
    }
  }
  return value;
};

const categorizeTone = (sentimentData) => {
  const { score, comparative } = sentimentData;

  if (score > 1 && comparative > 0) {
      return "Positive";
  } else if (score < -1 && comparative < 0) {
      return "Negative";
  } else if (Math.abs(comparative) <= 0.5) {
      return "Neutral";
  } else {
      return "Mixed";
  }
}

const getSlots = async(userToken, calendarID) =>{
  const nylas = NylasConfig.with(userToken);

  const twentyDaysFromNow = new Date();
  twentyDaysFromNow.setDate(twentyDaysFromNow.getDate() + 20);

  const endsBeforeISO = twentyDaysFromNow.toISOString();

  const events = await nylas.events.list({
    calendar_id: calendarID,
    starts_after: Date.now(),
    ends_before: endsBeforeISO,
  });
  return events;
}

const formatDate = (timestamp, timezoneOffset) => {
  const date = new Date(timestamp * 1000); // Multiply by 1000 to convert seconds to milliseconds

  // Adjust the date and time based on the timezone offset
  date.setMinutes(date.getMinutes() + timezoneOffset);

  // Get the various components of the adjusted date and time
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed, so add 1
  const day = date.getUTCDate().toString().padStart(2, '0');
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const seconds = date.getUTCSeconds().toString().padStart(2, '0');
  const milliseconds = date.getUTCMilliseconds().toString().padStart(3, '0');

  // Format the date and time as an ISO 8601 string
  const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;

  return formattedDate;
};

const hello = (req, res) => {
  return res.send("server is running");
};

const generateAuthURL = async (req, res) => {
  const { body } = req;

  const authUrl = NylasConfig.urlForAuthentication({
    loginHint: body.email_address,
    redirectURI: "https://productivity-nexus.vercel.app/mail",
    scopes: [Scope.EmailModify, Scope.EmailSend, Scope.Calendar],
  });

  return res.send(authUrl);
};

const getTokenFromCode = async (req, res) => {
  const { body } = req;
  try {
    const { accessToken, emailAddress } =
      await NylasConfig.exchangeCodeForToken(body.token);

    // store the access token in the DB
    // console.log('Access Token was generated for: ' + emailAddress);
    // console.log("Generated Access Token",accessToken);

    let user = await User.findOne({ email: emailAddress });
    let name = "";
    if (user) {
      // User exists, update the access token
      user.accessToken = accessToken;
      await user.save();

      //to get user details
      const nylas = NylasConfig.with(accessToken);
      const account = await nylas.account.get();
      name = account.name;

      console.log("Access Token was updated for: " + emailAddress);
    } else {
      // User doesn't exist, create a new user
      user = await User.create({
        email: emailAddress,
        accessToken: accessToken,
      });
      console.log("New user created with email: " + emailAddress);
    }

    return res.status(200).json({
      id: user._id,
      email: user.email,
      name: name,
    });
    // return res.send("Access Token Successfully Saved.")
  } catch (err) {
    console.log(err);
    return res.send(err);
  }
};

const getUserDetails = async (req, res) => {
  try {
    const { emailAddress } = req.params;
    let user = await User.findOne({ email: emailAddress });
    if (user) {
      const userToken = user?.accessToken;
      const nylas = NylasConfig.with(userToken);

      const account = await nylas.account.get();
      const name = account.name;
      const email = account.emailAddress;

      return res.status(200).json({ name: name, email: email });
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Sever Error");
  }
};

const sendEmail = async (req, res) => {
  try {
    const { subject, body, recipient_array, sender_email } = req.body;
    if (!subject || !body || !recipient_array || !sender_email) {
      return res.status(422).json({ message: "Please enter all data" });
    }
    const user = await User.findOne({ email: sender_email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const userToken = user?.accessToken;
    const nylas = NylasConfig.with(userToken);

    const draft = new Draft(nylas, {
      subject: subject,
      body: body,
      to: recipient_array,
    });
    await draft.send();

    return res.status(200).send("mail sent successfully");
  } catch (err) {
    console.log(err);
    return res.status(500).send("could not send email");
  }
};

const readInbox = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(422).json({ message: "Please send sender's email id" });
    }
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const userToken = user?.accessToken;
    // token = "t4qLPsX1c2KMCXpGMP3Qe6BVce0xBx";
    const nylas = NylasConfig.with(userToken);
    const labelArray = [];

    const account = await nylas.account.get();
    if (account.organizationUnit === "label") {
      const labels = await nylas.labels.list({});
      for (const label of labels) {
        if (
          label.displayName !== "[Imap]/Drafts" &&
          label.displayName !== "Drafts" &&
          label.displayName !== "Category Forums"
        ) {
          const labelName = labelMap[label.displayName]
            ? labelMap[label.displayName]
            : label.displayName;
          labelArray.push(labelName);
        }
      }
    }

    const messageData = {};
    for (const label of labelArray) {
      const messages = await nylas.messages.list({ in: label, limit: 15 });
      const labelKey = getLabelForKey(label);

      if (!messageData[labelKey]) {
        messageData[labelKey] = [];
      }
      messages.forEach((message) => {
//console.log(message);
        messageData[labelKey].push({
          ID: message.id,
          subject: message.subject,
          unread: message.unread,
          snippet: message.snippet,
          sentTo: message.to,
          sentBy: message.from,
          date: message.date,
          body: message.body
          // body: message.body
        });
      });
    }
    return res.status(200).send(messageData);
  } catch (err) {
    console.log(err);
    return res.status(500).send("could not send email");
  }
};

const starEmail = async (req, res) => {
  const userEmail = req.body.email;
  const starredEmail = req.body.starredEmail;
  if (!userEmail || !starredEmail) {
    return res.status(422).json({ message: "Please send all fields" });
  }
  try {
    let user = await User.findOne({ email: userEmail });

    if (!user) {
      // user = new User({
      //   email: userEmail,
      //   starredEmails: [starredEmail],
      // });
      return res.status(404).json({ message: "User not found" });
    } else {
      user.starredEmails.push(starredEmail);
    }

    const savedUser = await user.save();
    return res.status(200).json(savedUser);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error saving starred email." });
  }
};

const getStarredMail = async (req, res) => {
  const userEmail = req.body.email;
  const currentDateTime = new Date();
  console.log(currentDateTime);
  if (!userEmail) {
    return res.status(422).json({ message: "Please send user's email ID" });
  }
  try {
    const user = await User.findOne({ email: userEmail });

    if (user) {
      const starredEmails = user.starredEmails;
      return res.status(200).json(starredEmails);
    } else {
      return res.status(404).json({ error: "User not found." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error fetching starred emails." });
  }
};

const scheduleMail = async (req, res) => {
  const userEmail = req.body.email;
  const scheduledEmail = req.body.scheduledEmail;
  const scheduledEmailID = req.body.scheduledEmail.ID;
  
  if (!userEmail || !scheduledEmail) {
    return res.status(422).json({ message: "Please send all fields" });
  }
  try {
    let user = await User.findOne({ email: userEmail });

    if (!user) {
      // user = new User({
      //   email: userEmail,
      //   scheduledEmails: [scheduledEmail],
      // });
      return res.status(404).json({ message: "User not found" });
    } else {
      user.scheduledEmails.push(scheduledEmail);
    }

    const savedUser = await user.save();

    const schedulingTime = scheduledEmail.scheduledAt;
    const dateTime = new Date(schedulingTime);
    console.log(dateTime);

    // Extract date and time components
    const month = dateTime.getUTCMonth() + 1; // Months are zero-based, so add 1
    const day = dateTime.getUTCDate();
    const hour = dateTime.getUTCHours();
    const minute = dateTime.getUTCMinutes();

    // Construct the cron expression
    const cronExpression = `${minute} ${hour} ${day} ${month} *`;
    console.log(cronExpression);
    cron.schedule(cronExpression, async () => {
      try {
        const userToken = user.accessToken;
        const nylas = NylasConfig.with(userToken);

        const draft = new Draft(nylas, {
          subject: scheduledEmail.subject,
          body: scheduledEmail.body,
          to: scheduledEmail.sentTo,
        });
        await draft.send();
        await User.updateOne(
          { _id: user._id },
          { $pull: { scheduledEmails: { ID: scheduledEmailID } } }
        );
        //once the send is successful try to delete from scheduled array
        console.log("Scheduled email sent:", scheduledEmail);
      } catch (error) {
        console.error("Error sending scheduled email:", error);
      }
    });

    return res.status(200).json(savedUser);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error scheduling email." });
  }
};

const getScheduledMail = async (req, res) => {
  const userEmail = req.body.email;
  if (!userEmail) {
    return res.status(422).json({ message: "Please send user's email ID" });
  }
  try {
    const user = await User.findOne({ email: userEmail });

    if (user) {
      const scheduledEmails = user.scheduledEmails;
      return res.status(200).json(scheduledEmails);
    } else {
      return res.status(404).json({ error: "User not found." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error fetching scheduled emails." });
  }
};

const getUserAvailability = async (req, res) => {
  const email = req.query.email;
  console.log(email);
  if (!email) {
    return res.status(422).json({ message: "Please send sender's email id" });
  }
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const userToken = user?.accessToken;
  let calendarID;
  const nylas = NylasConfig.with(userToken);

  const calendars = await nylas.calendars.list().then((calendars) => {
    calendars?.forEach((calendar) => {
      if (calendar.isPrimary) {
        calendarID = calendar.id;
      }
    });
  });

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 20);

  const endsBeforeISO = sevenDaysFromNow.toISOString();

  const events = await nylas.events.list({
    calendar_id: calendarID,
    starts_after: Date.now(),
    ends_before: endsBeforeISO,
  });
  return res.json(events);
};

const readEvents = async (req, res) => {
  const { calendarId, startsAfter, endsBefore, limit } = req.query;

  const events = await NylasConfig.with(token)
    .events.list({
      calendar_id: calendarId,
      starts_after: startsAfter,
      ends_before: endsBefore,
      limit: limit,
    })
    .then((events) => events);

  return res.json(events);
};

const readCalendars = async (req, res) => {
  const calendars = await NylasConfig.with(token)
    .calendars.list()
    .then((calendars) => calendars);

  return res.json(calendars);
};

const createEvents = async (req, res) => {
  const { email, startTime, endTime, description, title, participants } =
    req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const userToken = user?.accessToken;
  let calendarID = "";
  const nylas = NylasConfig.with(userToken);

  const calendars = await nylas.calendars.list().then((calendars) => {
    calendars?.forEach((calendar) => {
      if (calendar.isPrimary) {
        calendarID = calendar.id;
      }
    });
  });

  const existingEvents = await getSlots(userToken,calendarID)
  

  const clash = existingEvents.some((existingEvent) => {
    const newStartTime = startTime;
    const newEndTime = endTime;
    const existingStartTime = existingEvent?.when?.startTime;
    const existingEndTime = existingEvent?.when?.endTime;

    // Check if existing event start time and end time are defined
    if (existingStartTime && existingEndTime) {
  
      if (newStartTime >= existingEndTime || newEndTime <= existingStartTime) {
        return false;
      } else {
        console.error("Overlap detected between new event and existing event");
        return true;
      }
    }
  });
  

  
  if (clash) {
    return res.status(400).json({ error: 'Event clashes with existing events.' });
  }


  const event = new Event(nylas);
  event.calendarId = calendarID;
  event.title = title;
  event.description = description;
  event.when.startTime = startTime;
  event.when.endTime = endTime;

  if (participants) {
    event.participants = participants
      .split(/s*,s*/)
      .map((email) => ({ email }));
  }
  event.notify_participants = true;
  event.save();

  return res.json(event);
};

const sentimentAnalysis = async(req,res) =>{
  const {content} = req.body;
  const sentiment = new Sentiment();
  const result = sentiment.analyze(content, { language: 'en' });
  
  const toneCategory = categorizeTone(result);
  const sentenceTone = toneCategory.toLowerCase();

  return res.status(200).json({tone: sentenceTone})
}

const summarizeText = async(req,res) =>{
  const {content, number} = req.body;
 const Summarizer = new summarizer(content,number); // summarize in given number of sentences
 const summary = Summarizer.getSummaryByFrequency().summary;

 return res.status(200).json({summary: summary})
}

module.exports = {
  hello,
  generateAuthURL,
  getTokenFromCode,
  sendEmail,
  readInbox,
  starEmail,
  getStarredMail,
  scheduleMail,
  getScheduledMail,
  getUserDetails,
  getUserAvailability,
  createEvents,
  readEvents,
  readCalendars,
  sentimentAnalysis,
  summarizeText
};
