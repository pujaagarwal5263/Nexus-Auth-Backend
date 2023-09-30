const express = require("express");
const router = express.Router();
const controllers = require("../controllers/controllers");

// Define a sample route
// router.get('/',controllers.hello);
router.post(
  "/nylas/generate-auth-url",
  express.json(),
  controllers.generateAuthURL
);
router.post(
  "/nylas/exchange-mailbox-token",
  express.json(),
  controllers.getTokenFromCode
);
router.get("/get_user_details/:emailAddress", controllers.getUserDetails);
router.post("/send_email", controllers.sendEmail);
router.post("/read_email", controllers.readInbox);
router.post("/star_email", controllers.starEmail);
router.post("/starred_mails", controllers.getStarredMail);
router.post("/schedule_email", controllers.scheduleMail);
router.post("/scheduled_mails", controllers.getScheduledMail);
router.get("/get_availability", controllers.getUserAvailability);
router.get("/nylas/read-events", controllers.readEvents);
router.get("/nylas/read-calendars", controllers.readCalendars);
router.post("/create-events", controllers.createEvents);

// AI Routes
router.post("/sentiment",controllers.sentimentAnalysis);
router.post("/summarize",controllers.summarizeText);

module.exports = router;
