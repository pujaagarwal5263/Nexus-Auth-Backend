# How to start guide?
1. Create your env with the following data:
   
```json
PORT=8000
NYLAS_CLIENT_ID=nylasclient
NYLAS_CLIENT_SECRET=nylasclientsecret
NYLAS_API_SERVER=https://api.nylas.com
MONGODB_URL=mongodb://localhost:27017
```

2. Configure redirect_uri in <strong>generateAuthURL</strong> function in controllers to:
```
FRONTEND_URL/mail
```

3. Install dependencies:
```
npm install
```

4. Start the code:
```
npm start
```

# Nylas Endpoints Documentation

This documentation provides information about the payload structure required for each endpoint.

## 1. POST: /read_email

**Description:**
Read a user's inbox when the email page is opened for the first time.

**Request Payload:**

```json
{
  "email": "current-user@gmail.com"
}
```

## 2. POST: /send_email

**Description:**
Send an email to a recepient.

**Request Payload:**

```json
{
  "subject": "test",
  "body": "Hi, I am puja from Nylas",
  "recipient_array": [
    {
      "name": "Receiver 1 (can put any random name as well)",
      "email": "receiver@gmail.com"
    }
  ],
  "sender_email": "current-user@gmail.com"
}
```

## 3. POST: /star_email

**Description:**
Star an email and show it in the favorites section.

**Request Payload:**

```json
{
  "email": "pujuagarwal5263@gmail.com",
  "starredEmail": {
    "ID":"w234",
    "subject": "testt",
    "unread": true,
    "snippet": "Hi",
    "sentTo": [
      {
        "name": "puja",
        "email": "test@gmail.com"
      }
    ],
    "sentBy": [
      {
        "name": "Ajinkya Palaskar",
        "email": "palaskarajinkya22@gmail.com"
      }
    ],
    "date": "2023-09-30T14:24:16.000Z",
    "body": "<div dir=\"ltr\">Hi</div>"
  }
}
```

## 4. POST: /starred_mails

**Description:**
Get starred emails from the database to display in the favorites section.

**Request Payload:**

```json
{
  "email": "current-user@gmail.com"
}
```

## 5. POST: /schedule_email

**Description:**
Schedule an email to be sent at a specified date and time.

**Request Payload:**

```json
{
  "email": "pujuagarwal5263@gmail.com",
  "scheduledEmail": {
    "ID":"w234",
    "subject": "testt",
    "unread": true,
    "snippet": "Hi",
    "sentTo": [
      {
        "name": "puja",
        "email": "test@gmail.com"
      }
    ],
    "sentBy": [
      {
        "name": "Ajinkya Palaskar",
        "email": "palaskarajinkya22@gmail.com"
      }
    ],
    "date": "2023-09-30T14:24:16.000Z",
    "body": "<div dir=\"ltr\">Hi</div>",
    "scheduledAt": "2023-10-01T11:42:00.000Z"
  }
}
```

## 6. POST: /scheduled_mails

**Description:**
Get scheduled emails from the database to display in the scheduled section.

**Request Payload:**

```json
{
  "email": "current-user@gmail.com"
}
```

## 7. GET: /get_user_details

**Description:**
Get users details by sending data in parameter.

**URL structure:**

```
/get_user_details/:emailAddress
```

**Example**

```
/get_user_details/:current-user@gmail.com
```

## 8. GET: /get_availability

**Description:**
Get availablity of any authenticated user from database. Get all calendar events in upcoming 7 days.

**URL structure:**

```
/get_availability/?email=user@gmail.com
```

<strong>put email ID of user-whose-availability-is-to-be-checked</strong>

## 9. POST: /create-events

**Description:**
Create an event from your mail ID or Google Account and add more participants.

**Request Payload:**

```json
{
  "email": "current-user@gmail.com",
  "startTime":"2023-07-30T15:05:00.000Z",
  "endTime":"2023-07-30T17:05:00.000Z",
  "title":"Meeting for Nylas Setup",
  "description":"lorem ipsum ...",
  "participants":"participant1@gmail.com,participant2@gmail.com"
}
```

## 10. POST: /summarize

**Description:**
To summarize text in given number of sentences using NLP based library.

```json
{
  "content": "lorem ipsum ...",
  "number":3
}
```

## 11. POST: /sentiment

**Description:**
To get sentiment analysis of given content using NLP based library.

```json
{
  "content": "lorem ipsum ..."
}
```
