const bcrypt = require("bcrypt");
const saltRounds = 10;

export const hashPasswordHelper = async (plainPassword) => {
    try {
        return await bcrypt.hash(plainPassword, saltRounds);
    } catch (error) {
        console.log(error);
    }
};

export const comparePasswordHelper = async (plainPassword, hashPassword) => {
    try {
        return await bcrypt.compare(plainPassword, hashPassword);
    } catch (error) {
        console.log(error);
    }
};
