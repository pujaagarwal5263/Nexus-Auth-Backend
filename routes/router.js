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
router.get("/read_email", controllers.readInbox);
router.post("/star_email", controllers.starEmail);
router.get("/starred_mails", controllers.getStarredMail);
router.post("/schedule_email", controllers.scheduleMail);
router.get("/scheduled_mails", controllers.getScheduledMail);
router.get("/get_availability", controllers.getUserAvailability);
router.get("/nylas/read-events", controllers.readEvents);
router.get("/nylas/read-calendars", controllers.readCalendars);
router.post("/nylas/create-events", controllers.createEvents);

module.exports = router;
