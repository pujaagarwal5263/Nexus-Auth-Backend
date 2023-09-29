# Nylas Endpoints Documentation

This documentation provides information about the payload structure required for each endpoint.

## 1. GET: /read_email

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
  "email": "current-user@gmail.com",
  "starredEmail": {
    "subject": "testt",
    "body": "this is email body",
    "recipient_array": [
      {
        "name": "puja",
        "email": "test@gmail.com"
      }
    ]
  }
}
```

## 4. GET: /starred_mails

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
  "email": "current-user@gmail.com",
  "scheduledEmail": {
    "subject": "testt",
    "body": "this is email body",
    "recipient_array": [
      {
        "name": "puja",
        "email": "test@gmail.com"
      }
    ],
    "scheduledAt": "2023-09-06T15:30:00.000Z"
  }
}
```

## 6. GET: /scheduled_mails

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
