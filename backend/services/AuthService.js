const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthService {
    static async register(login, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ login, password: hashedPassword });
        return user;
    }

    static async login(login, password) {
        const user = await User.findOne({ where: { login } });
        if (!user) throw new Error('User not found');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error('Invalid password');

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '10h' });
        return token;
    }
}

module.exports = AuthService;
