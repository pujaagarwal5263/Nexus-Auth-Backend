const { NylasConfig } = require("../nylas-config");
const User = require("../models/userSchema");
const { Scope } = require("nylas/lib/models/connect");

const hello = (req,res) =>{
    return res.send("server is running")
}

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

module.exports={hello, generateAuthURL, getTokenFromCode }