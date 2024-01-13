const moment = require('moment');

function formatMesssage (username, textMessage) {
    return{
        username, 
        textMessage,
        time : moment().format('h:mm a')
    };
}

module.exports = formatMessage;