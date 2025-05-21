const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function verifyWebSocketToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.id; // или весь decoded, если нужно
    } catch (err) {
        return null;
    }
}
module.exports = { verifyWebSocketToken };
