const express = require('express');
const cors = require('cors');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const app = express();
app.use(cors());

const APP_ID = 'c0613e123a9f42efa9e899634123435e';
const APP_CERTIFICATE = '4bd507b0c1684b1c9279a75056714e72';

app.get('/token', (req, res) => {
    const channelName = 'qamar-chat';
    const uid = Math.floor(Math.random() * 1000000);
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    const token = RtcTokenBuilder.buildTokenWithUid(
        APP_ID,
        APP_CERTIFICATE,
        channelName,
        uid,
        role,
        privilegeExpiredTs
    );
    
    res.json({ token: token });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Token server running');
});
