const router = require('express').Router()
const check = require('express-validator').check
const validationResult = require('express-validator').validationResult
const bcrypt = require('bcrypt')

router.post(
    '/registerNewUser',
    [
        check('phoneNumber', "Некоректный номер телефона").isMobilePhone(),
    ],
    async (req, res) => {
        try {
            console.log('reg with value ', req.body);

            const { Users, CurrencyAccounts } = req.firestore

            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors[0],
                    message: 'некоректные данные при регистрации'
                })
            }

            const { password } = req.body
            let { phoneNumber } = req.body
            const regx = /\D/
            phoneNumber = Number(phoneNumber.replace(regx, ''))

            const candidatList = await Users.where('phoneNumber', '==', phoneNumber).get()

            if (candidatList.size != 0) {
                return res.status(400).json({
                    error: 'этот номер телефона уже занят',
                    message: 'этот номер телефона уже занят'
                })
            }

            const hash = await bcrypt.hash(password, 12)
            const user = await Users.add({
                phoneNumber,
                password: hash
            })
            const accountRub = await CurrencyAccounts.add({
                ownerId: user.id,
                type: 'RUB',
                count: 0,
                registerDate: Date.now(),
            })
            const accountUsd = await CurrencyAccounts.add({
                ownerId: user.id,
                type: 'KZT',
                count: 0,
                registerDate: Date.now()
            })

            if (user.id && accountRub.id && accountUsd.id) {
                return res.status(200).json({
                    id: user.id,
                    phoneNumber,
                    message: 'пользлватель создан'
                })
            } else return res.status(500).json({ message: 'что-то пошло не так' })

        } catch (e) {
            console.log(e);
            res.status(500).json({ message: 'что-то пошло не так' })
        }
    }
)

router.post(
    '/loginUser',
    [
        check('phoneNumber', 'некорректный номер').isMobilePhone(),
        check('password', 'некорректный пароль').isLength({ min: 6 })
    ],
    async (req, res) => {
        console.log('trying to login with ', req.body);
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                console.log('uncorrect value');
                return res.status(400).json({
                    error: errors[0],
                    message: 'некоректные данные при авторизации'
                })
            }

            const { Users } = req.firestore

            const { password } = req.body
            let { phoneNumber } = req.body
            const regx = /\D/
            phoneNumber = Number(phoneNumber.replace(regx, ''))

            Users.where('phoneNumber', '==', phoneNumber).get()
                .then(snapshot => {
                    if (snapshot.size == 0) {
                        return res.status(400).json({
                            error: 'пользователь не существует',
                            message: 'пользователь не существует'
                        })
                    }
                    else {
                        snapshot.forEach(rawUser => {
                            const user = rawUser.data()
                            bcrypt.compare(password, user.password)
                                .then(match => {
                                    if (match) {
                                        return res.status(200).json({
                                            id: rawUser.id,
                                            phoneNumber: user.phoneNumber,
                                            message: 'вход выполнен'
                                        })
                                    } else {
                                        return res.status(400).json({
                                            error: 'не правильный номер телефона или пароль',
                                            message: 'не правильный номер телефона или пароль'
                                        })
                                    }
                                })
                        });
                    }

                })

        } catch (e) {
            console.log(e);
            res.status(500).json({ message: 'что-то пошло не так' })
        }
    }
)

module.exports = router