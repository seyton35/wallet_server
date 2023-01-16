const router = require('express').Router()
const check = require('express-validator').check
const validationResult = require('express-validator').validationResult

const Currency = require('../models/Currency')
const Request = require('../models/Request')
const User = require('../models/User')

router.post(
    '/clientMoneyRequest',
    [
        check('receiver', "Некоректный номер телефона").isMobilePhone(),
    ],
    async (req, res) => {
        try {
            console.log('ClientMoneyRequest with value ', req.body);
            const { errors } = validationResult(req)
            const { Transaction } = req.firestore

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

            const request = {
                registerDate: Date.now(),
                type: 'Перевод на Wallet',
                sender: {
                    id: hasSender._id.toString(),
                    number: hasSender.phoneNumber,
                    sum,
                    currency
                },
                receiver: {
                    id: hasReceiver._id.toString(),
                    number: hasReceiver.phoneNumber
                },
            }
            if (comment) request.comment = comment

            Transaction.add(request)
                .then(docRef => console.log(docRef.id))
                .catch(e => console.log(e.message))

            // TODO: add pushNotification
            // return res.status(200).json({
            //     message: 'счет успешно выставлен',
            //     status: 'success',
            // })

        } catch (e) {
            console.log(e);
            res.status(500).json({ message: 'что-то пошло не так' })
        }
    }
)

router.post(
    '/currencyConversion',
    async (req, res) => {
        try {
            console.log('currencyСonversion with value ', req.body);

            const { id, rate, sum } = req.body
            let { recipient, donor } = req.body

            const hasUser = await User.findOne({ _id: id })
            if (hasUser === null) {
                return res.status(400).json({
                    message: 'пользователь не существует'
                })
            }

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

                const moneyRequst = new Request({
                    type: 'Wallet (конвертация)',
                    sender: {
                        id: hasUser._id,
                        number: hasUser.phoneNumber,
                        currency: recipient,
                        sum,
                    },
                    receiver: {
                        id: hasUser._id,
                        number: hasUser.phoneNumber,
                        sum: dif,
                        currency: donor,
                    },
                    status: 'success',
                    paymentDate: Date.now()
                })
                await moneyRequst.save()
            }
            return res.status(200).json({
                message: 'перевод успешно выполнен'
            })


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
            const { idUser, idBill, currencyType, rate } = req.body

            const bill = await Request.findById(idBill)

            if (
                bill == null ||
                bill.receiver.id !== idUser
            )
                return res.status(404).json({
                    message: 'счет не найден'
                })

            if (bill.status != 'active') return res.status(202).json({
                message: 'счет уже оплачен'
            })

            const currency = await Currency.findOne({
                $and: [
                    { ownerId: idUser },
                    { type: currencyType }
                ]
            })
            if (currency == null) {
                return res.status(500).json({
                    message: 'что-то пошло не так'
                })
            }

            if (currency.type == bill.sender.currency) {
                if (currency.count < bill.sender.sum) return res.status(500).json({
                    message: 'недостаточно средств на счету'
                })
            } else if (currency.count < (bill.sender.sum * rate)) {

            }

            if (bill.sender.currency == currencyType) {
                currency.count -= bill.sender.sum
                bill.receiver.sum = bill.sender.sum
            } else {
                const dif = bill.sender.sum * rate
                bill.receiver.sum = dif
            }

            bill.status = 'success'
            bill.receiver.currency = currencyType
            bill.paymentDate = Date.now()

            await currency.save()
            await bill.save()

            return res.status(200).json({
                message: 'счет успешно оплачен'
            })

        } catch (e) {
            console.log(e.message);
        }
    }
)

router.post(
    '/rejectBill',
    async (req, res) => {
        try {
            console.log('rejectBill with ', req.body);
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