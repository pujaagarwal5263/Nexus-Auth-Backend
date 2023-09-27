const { NylasConfig } = require("../nylas-config");
const User = require("../models/userSchema");
const { Scope } = require("nylas/lib/models/connect");
const { default: Draft } = require("nylas/lib/models/draft");

const labelMap = {
  Inbox: "inbox",
  "Sent Mail": "sent",
  Trash: "trash",
  "Category Social": "social",
  "Category Updates": "updates",
  Important: "important",
  "Category Personal": "personal",
  Spam: "spam",
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

const hello = (req, res) => {
  return res.send("server is running");
};

const generateAuthURL = async (req, res) => {
  const { body } = req;

  const authUrl = NylasConfig.urlForAuthentication({
    loginHint: body.email_address,
    redirectURI: "http://localhost:3000/dashboard",
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
    console.log(user);
    if (user) {
      // User exists, update the access token
      user.accessToken = accessToken;
      await user.save();
      console.log("Access Token was updated for: " + emailAddress);
    } else {
      // User doesn't exist, create a new user
      user = await User.create({
        email: emailAddress,
        accessToken: accessToken,
      });
      console.log("New user created with email: " + emailAddress);
    }

    return res.json({
      id: user._id, // Assuming your User model uses "_id" as the primary key
      emailAddress: user.email,
    });
    // return res.send("Access Token Successfully Saved.")
  } catch (err) {
    console.log(err);
    return res.send(err);
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
      const messages = await nylas.messages.list({ in: label, limit: 10 });
      const labelKey = getLabelForKey(label);

      if (!messageData[labelKey]) {
        messageData[labelKey] = [];
      }
      messages.forEach((message) => {
        messageData[labelKey].push({
          ID: message.id,
          subject: message.subject,
          unread: message.unread,
          snippet: message.snippet,
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
          to: scheduledEmail.recipient_array,
        });
        console.log("hii im here");
        await draft.send();
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

module.exports = { hello, generateAuthURL, getTokenFromCode, sendEmail, readInbox, starEmail, getStarredMail, scheduleMail, getScheduledMail };

