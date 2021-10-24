module.exports = {
    // send email with data passed in function
    sendEmailData: function(subject, data) {
        const nodemailer = require('nodemailer');
        // setup nodemailer transport for email notification
        const transport = nodemailer.createTransport({
            host: "smtp.fastmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.FASTMAIL_USER,
                pass: process.env.FASTMAIL_APPPWD
            }
        });
        const mailOptions = {
            from: 'christina.c@bitcoin.org.hk',
            to: 'christina.c@bitcoin.org.hk',
            subject: subject,
            text: data,
            html: data
        };
        transport.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
        });
    },
}