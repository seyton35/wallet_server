const router = require('express').Router()
const check = require('express-validator').check
const validationResult = require('express-validator').validationResult
const bcrypt = require('bcrypt')

const User = require('../models/User')
const Currency = require('../models/Currency')

router.post(
    '/registerNewUser',
    [
        check('phoneNumber', "Некоректный номер телефона").isMobilePhone(),
    ],
    async (req, res) => {
        try {
            console.log('reg with value ', req.body);
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

            const candidate = await User.findOne({ phoneNumber })
            if (candidate) {
                return res.status(400).json({
                    error: 'этот номер телефона уже занят',
                    message: 'этот номер телефона уже занят'
                })
            }
            const hash = await bcrypt.hash(password, 12)

            const user = new User({ phoneNumber, password: hash })
            const RUBcurrency = new Currency({ ownerId: user._id, type: 'RUB' },)
            const USDcurrency = new Currency({ ownerId: user._id, type: 'USD' },)

            if (user && RUBcurrency && USDcurrency) {
                await RUBcurrency.save()
                await USDcurrency.save()
                await user.save()
            } else return res.status(500).json({ message: 'что-то пошло не так' })

            return res.status(200).json({
                idUser: user._id,
                phoneNumber: user.phoneNumber,
                message: 'пользлватель создан'
            })

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

            const { password } = req.body
            let { phoneNumber } = req.body
            const regx = /\D/
            phoneNumber = Number(phoneNumber.replace(regx, ''))

            const user = await User.findOne({ phoneNumber })

            if (!user) {
                return res.status(400).json({
                    error: 'пользователь не существует',
                    message: 'пользователь не существует'
                })
            }

            bcrypt.compare(password, user.password)
                .then(match => {
                    if (match) {
                        return res.status(200).json({
                            id: user._id,
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

        } catch (e) {
            console.log(e);
            res.status(500).json({ message: 'что-то пошло не так' })
        }
    }
)

module.exports = router