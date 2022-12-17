const router = require('express').Router()
const check = require('express-validator').check
const validationResult = require('express-validator').validationResult

const Currency = require('../models/Currency')
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
                type: 'Перевод на Wallet',
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
            return res.status(200).json({
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

router.post(
    '/transferBetweenCurrencyes',
    async (req, res) => {
        try {
            console.log('transferBetweenCurrencyes with value ', req.body);

            const { id, rate, sum } = req.body
            let { recipient, donor } = req.body
            // recipient = recipient.toLowerCase()
            // donor = donor.toLowerCase()

            const hasUser = await User.findOne({ _id: id })
            if (hasUser === null) {
                return res.status(400).json({
                    message: 'пользователь не существует'
                })
            }

            //TODO: проверка счетов


            // axios.request({ TODO: запрашивать курс валют здесь
            //     method: 'GET',
            //     url: `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/${donor}/${recipient}.json`,
            //     responseType: 'json',
            //     reponseEncoding: 'utf8'
            // })
            //     .then(res => { console.log(res.data) })
            //     .catch(e => console.log(e))

            const hasRecipient = await Currency.findOne({
                $and: [
                    { ownerId: id },
                    { type: recipient }
                ]
            })
            const hasDonor = await Currency.findOne({
                $and: [
                    { ownerId: id },
                    { type: donor }
                ]
            })
            if (!(hasDonor && hasRecipient)) {
                return res.status(400).json({
                    message: 'счета отсутствуют'
                })
            }

            const dif = sum * rate
            hasRecipient.count += sum
            hasDonor.count -= dif
            if (hasDonor.count <= 0) {
                return res.status(400).json({
                    message: 'недостаточно средств на счету'
                })
            }
            else {
                await hasDonor.save()
                await hasRecipient.save()
            }
            return res.status(200).json({
                message: 'перевод выполнен'
            })

            // const moneyRequst = new Request({
            //     sender: {
            //         id: hasUser._id,
            //         phoneNumber: hasUser.phoneNumber
            //     },
            //     receiver: {
            //         id: hasReceiver._id,
            //         phoneNumber: hasReceiver.phoneNumber
            //     },
            //     currency, sum, comment
            // })
            // await moneyRequst.save()


        } catch (e) {
            console.log(e);
            res.status(500).json({ message: 'что-то пошло не так' })
        }
    }
)

router.post(
    '/billPayment',
    async (req, res) => {
        try {
            console.log('billPayment with ', req.body);
            const { idUser, idBill, currency: currencyType } = req.body
            const bill = await Request.findById(idBill)

            if (
                bill == null ||
                bill.receiver.id !== idUser
            ) return res.status(404).json({
                message: 'счет не найден'
            })

            const currency = await Currency.findOne({ ownerId: idUser })
            if (currency == null) return res.status(500).json({
                message: 'что-то пошло не так'
            })

            if (currency.count < bill.sum) return res.status(500).json({
                message: 'недостаточно средств на счету'
            })

            currency.count -= bill.sum
            bill.status = 'paid'
            bill.paymentDate = Date.now()

            await currency.save()
            await bill.save()

            return res.status(200).json({
                message: 'счет оплачен'
            })

        } catch (e) {
            console.log(e.message);
        }
    }
)

router.post(
    '/rejectBillPayment',
    async (req, res) => {
        try {
            console.log('rejectBillPayment with ', req.body);
            const { idUser, idBill } = req.body

            const bill = await Request.findById(idBill)

            if (
                bill == null ||
                bill.receiver.id !== idUser
            ) return res.status(404).json({
                message: 'счет не найден'
            })

            bill.status = 'rejected' 
            bill.paymentDate = Date.now()

            await bill.save()

            return res.status(200).json({
                message: 'счет отклонен'
            })

        } catch (e) {
            console.log(e.message);
        }
    }
)

module.exports = router