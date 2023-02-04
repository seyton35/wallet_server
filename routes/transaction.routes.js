const router = require('express').Router()
const check = require('express-validator').check
const validationResult = require('express-validator').validationResult


router.post(
    '/clientMoneyRequest',
    [
        check('receiver', "Некоректный номер телефона").isMobilePhone(),
    ],
    async (req, res) => {
        try {
            console.log('ClientMoneyRequest with value ', req.body);
            const { errors } = validationResult(req)
            const { Transaction, Users, UserConfig, messaging } = req.firestore

            if (errors.length) {
                return res.status(400).json({
                    message: errors[0].msg,
                })
            }

            const { sender: senderNumber, currency, comment } = req.body
            let { receiver: receiverNumber, sum } = req.body
            sum = Number(sum)
            const regx = /\D/
            receiverNumber = Number(receiverNumber.replace(regx, ''))

            if (receiverNumber == senderNumber) {
                return res.status(400).json({
                    message: 'это ваш номер'
                })
            }

            let sender, receiver = null

            await Users
                .where('phoneNumber', '==', senderNumber)
                .get()

                .then(snapshot => snapshot.forEach(document => sender = {
                    ...document.data(),
                    _id: document.id
                }))
            await Users
                .where('phoneNumber', '==', receiverNumber)
                .get()

                .then(snapshot => snapshot.forEach(document => receiver = {
                    ...document.data(),
                    _id: document.id
                }))

            if (!(receiver && sender)) {
                return res.status(400).json({
                    message: 'пользователь с таким номером не существует'
                })
            }

            const request = {
                registerDate: Date.now(),
                type: 'Перевод на Wallet',
                status: 'active',
                sender: {
                    id: sender._id.toString(),
                    number: sender.phoneNumber,
                    sum,
                    currency
                },
                receiver: {
                    id: receiver._id.toString(),
                    number: receiver.phoneNumber
                },
            }
            if (comment) request.comment = comment

            await Transaction.add(request)
                .then(docRef => request._id = docRef.id)
                .catch(e => console.log(e.message))

            await UserConfig.doc(receiver._id).get()
                .then(docRef => {
                    const doc = docRef.data()
                    if (doc.pushNotificationSettings.incomingBill)
                        messaging.sendToDevice(
                            receiver.tokens,
                            {
                                data: {
                                    data: JSON.stringify({ bill: request }),
                                    screen: 'billPayment',
                                    navigation: 'true'
                                },
                                notification: {
                                    title: 'вам выставлен счет',
                                    body: `${request.type} ${request.sender.sum} ${request.sender.currency}`,
                                }
                            }
                        )
                })
            return res.status(200).json({
                message: 'счет успешно выставлен',
                status: 'success',
            })

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

            const { CurrencyAccounts, Transaction } = req.firestore
            const { idUser, phoneNumber, rate } = req.body
            let { recipient, donor, sum } = req.body
            sum = Number(sum)

            let hasRecipient, hasDonor = null

            await CurrencyAccounts
                .where('ownerId', '==', idUser)
                .where('type', '==', recipient)
                .get()

                .then(snapshot => snapshot
                    .forEach(document => {
                        hasRecipient = {
                            ...document.data(),
                            _id: document.id
                        }
                    }))

            await CurrencyAccounts
                .where('ownerId', '==', idUser)
                .where('type', '==', donor)
                .get()

                .then(snapshot => snapshot
                    .forEach(document => {
                        hasDonor = {
                            ...document.data(),
                            _id: document.id
                        }
                    }))

            const dif = sum * rate
            hasRecipient.count += sum
            hasDonor.count -= dif

            if (hasDonor.count <= 0) {
                return res.status(400).json({
                    message: 'недостаточно средств на счету'
                })
            }
            else {
                CurrencyAccounts.doc(hasDonor._id).update({
                    count: hasDonor.count
                })
                CurrencyAccounts.doc(hasRecipient._id).update({
                    count: hasRecipient.count
                })
            }

            const request = {
                type: 'Wallet (конвертация)',
                sender: {
                    id: idUser,
                    number: phoneNumber,
                    currency: recipient,
                    sum,
                },
                receiver: {
                    id: idUser,
                    number: phoneNumber,
                    sum: dif,
                    currency: donor,
                },
                status: 'success',
                registerDate: Date.now(),
                paymentDate: Date.now()
            }
            await Transaction.add(request)

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
            const { Transaction, CurrencyAccounts, Users, UserConfig, messaging } = req.firestore

            let bill = null
            await Transaction
                .doc(idBill).get()
                .then(document => {
                    bill = {
                        ...document.data(),
                        _id: document.id
                    }
                })

            if (bill == null)
                return res.status(404).json({
                    message: 'счет не найден'
                })
            if (bill.status != 'active') return res.status(202).json({
                message: 'счет уже оплачен'
            })

            let recipient, donor = null

            await CurrencyAccounts
                .where('ownerId', '==', bill.receiver.id)
                .where('type', '==', currencyType)
                .get()

                .then(snapshot => snapshot
                    .forEach(document => {
                        donor = {
                            ...document.data(),
                            _id: document.id
                        }
                    }))

            await CurrencyAccounts
                .where('ownerId', '==', bill.sender.id)
                .where('type', '==', bill.sender.currency)
                .get()

                .then(snapshot => snapshot
                    .forEach(document => {
                        recipient = {
                            ...document.data(),
                            _id: document.id
                        }
                    }))

            if (!(recipient && donor)) {
                return res.status(500).json({
                    message: 'что-то пошло не так'
                })
            }

            if (donor.type == bill.sender.currency) {
                if (donor.count < bill.sender.sum) {
                    return res.status(500).json({
                        message: 'недостаточно средств на счету'
                    })
                }
                else {
                    donor.count -= bill.sender.sum
                    bill.receiver.sum = bill.sender.sum
                }
            } else if (donor.count < (bill.sender.sum * rate)) {
                return res.status(500).json({
                    message: 'недостаточно средств на счету'
                })
            } else {
                const dif = bill.sender.sum * rate
                donor.count -= dif
                bill.receiver.sum = dif
            }

            recipient.count += bill.sender.sum
            bill.status = 'success'
            bill.receiver.currency = currencyType
            bill.paymentDate = Date.now()

            await CurrencyAccounts.doc(donor._id).update({
                count: donor.count
            })
            await CurrencyAccounts.doc(recipient._id).update({
                count: recipient.count
            })


            delete bill['_id']
            await Transaction.doc(idBill).set({
                ...bill
            })
                .then(async () => {
                    await UserConfig.doc(bill.receiver.id).get()
                        .then(async docRef => {
                            const userRef = await Users.doc(bill.receiver.id).get()
                            const { tokens } = userRef.data()
                            const doc = docRef.data()
                            if (doc.pushNotificationSettings.writeOff)
                                messaging.sendToDevice(
                                    tokens,
                                    {
                                        data: {
                                            data: JSON.stringify({}),
                                            screen: 'history',
                                            navigation: 'true'
                                        },
                                        notification: {
                                            title: 'Wallet',
                                            body: `${bill.type} \u2014 ${bill.receiver.sum} ${bill.receiver.currency}`,
                                        }
                                    }
                                )
                        })
                    await UserConfig.doc(bill.sender.id).get()
                        .then(async docRef => {
                            const userRef = await Users.doc(bill.sender.id).get()
                            const { tokens } = userRef.data()
                            const doc = docRef.data()
                            if (doc.pushNotificationSettings.refill)
                                messaging.sendToDevice(
                                    tokens,
                                    {
                                        data: {
                                            data: JSON.stringify({}),
                                            screen: 'history',
                                            navigation: 'true'
                                        },
                                        notification: {
                                            title: 'Wallet',
                                            body: `зачисленно \u2014 ${bill.sender.sum} ${bill.sender.currency}`,
                                        }
                                    }
                                )
                        })
                })
                .catch(e => console.log(e.message))

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

            const { Transaction } = req.firestore
            const { idUser, idBill } = req.body

            const billRef = await Transaction.doc(idBill).get()

            const bill = billRef.data()
            if (bill == null ||
                bill.receiver.id !== idUser) {
                return res.status(404).json({
                    message: 'счет не найден'
                })
            }

            bill.status = 'rejected'
            bill.paymentDate = Date.now()

            await Transaction.doc(idBill).update({
                status: bill.status,
                paymentDate: bill.paymentDate
            })

            return res.status(200).json({
                message: 'счет отклонен'
            })

        } catch (e) {
            console.log(e.message);
            return res.status(500).json({
                message: 'что-то пошло не так...'
            })
        }
    }
)

module.exports = router