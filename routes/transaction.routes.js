const router = require('express').Router()
const check = require('express-validator').check
const validationResult = require('express-validator').validationResult

const Request = require('../models/Request')
const User = require('../models/User')

router.post(
    '/ClientMoneyRequest',
    [
        check('receiver', "Некоректный номер телефона").isMobilePhone(),
    ],
    async (req, res) => {
        try {
            console.log('ClientMoneyRequest with value ', req.body);
            const { errors } = validationResult(req)
            if (errors.length) {
                return res.status(400).json({
                    message: errors[0].msg,
                })
            }

            const { sender, currency, sum, comment } = req.body
            let { receiver } = req.body
            const regx = /\D/
            receiver = Number(receiver.replace(regx, ''))

            if (receiver == sender) {
                return res.status(400).json({
                    message: 'это ваш номер'
                })
            }

            const hasSender = await User.findOne({ phoneNumber: sender })
            if (hasSender === null) {
                return res.status(400).json({
                    message: 'пользователя с таким номером не существует'
                })
            }
            const hasReceiver = await User.findOne({ phoneNumber: receiver })
            if (hasReceiver === null) {
                return res.status(400).json({
                    message: 'пользователя с таким номером не существует'
                })
            }

            const moneyRequst = new Request({
                sender: {
                    id: hasSender._id,
                    phoneNumber: hasSender.phoneNumber
                },
                receiver: {
                    id: hasReceiver._id,
                    phoneNumber: hasReceiver.phoneNumber
                },
                currency, sum, comment
            })
            await moneyRequst.save()

            //TODO: socket message for request
            res.json({
                message: 'счет выставлен',
                status: 'success',
                receiverId: hasReceiver._id
            })

        } catch (e) {
            console.log(e);
            res.status(500).json({ message: 'что-то пошло не так' })
        }
    }
)

module.exports = router