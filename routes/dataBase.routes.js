const router = require('express').Router()

const Currency = require('../models/Currency');
const Request = require('../models/Request')


router.post(
    '/fetchActiveBills',
    async (req, res) => {
        console.log('fetchActiveBills with :', req.body);
        try {
            const { idUser } = req.body


            // const { Transaction } = req.firestore
            // Transaction.get()
            //     .then((querySnapshot) => querySnapshot.forEach(document => {
            //         console.log(document.data());
            //     }))
            //     .catch(e => console.log(e.message))

            const activeBills = await Request.find({
                $and: [
                    { "receiver.id": idUser },
                    { status: 'active' }
                ]
            }).sort({ registerDate: -1 })
            if (!activeBills) {
                return res.status(204).json({
                    message: 'неоплаченных счетов нет'
                })
            }
            return res.json({
                message: 'success',
                activeBills
            })

        } catch (e) {
            console.log(e);
            res.status(500).json({ message: 'что-то пошло не так' })
        }
    }
)

router.post(
    '/fetchClosedBills',
    async (req, res) => {
        console.log('feychClosedBills with :', req.body);
        try {
            const { idUser } = req.body

            const closedBills = await Request.find({
                $and: [
                    {
                        $or: [
                            { "sender.id": idUser },
                            { "receiver.id": idUser },
                        ]
                    },
                    { status: { $ne: 'active' } }
                ]
            }).sort({ paymentDate: -1 })
            return res.json({
                message: 'success',
                closedBills
            })

        } catch (e) {
            console.log(e);
            res.status(500).json({ message: 'что-то пошло не так' })
        }
    }
)

router.post(
    '/fetchBillsByCategory',
    async (req, res) => {
        console.log('fetchBillsByCategory with :', req.body);
        try {
            const { idUser, category, timeRange } = req.body

            const endDate = new Date(timeRange.date2).setHours(23, 59, 59)
            const beginDate = new Date(timeRange.date1).setHours(00, 00, 00)
            let billsByCategory

            if (category == 'received') {
                billsByCategory = await Request.find({
                    $and: [
                        { 'receiver.id': idUser },
                        { type: { $ne: 'Wallet (конвертация)' } },
                        { registerDate: { $gte: beginDate, $lte: endDate } }
                    ]
                }).sort({ registerDate: -1 })
            }
            else {
                billsByCategory = await Request.find({
                    $and: [
                        { 'sender.id': idUser },
                        { type: { $ne: 'Wallet (конвертация)' } },
                        { registerDate: { $gte: beginDate, $lte: endDate } }
                    ]
                }).sort({ registerDate: -1 })
            }

            return res.json({
                message: 'success',
                billsByCategory
            })

        } catch (e) {
            console.log(e);
            res.status(500).json({ message: 'что-то пошло не так' })
        }
    }
)

router.post(
    '/fetchAllCurrencyes',
    async (req, res) => {
        console.log('fetchAllCurrencyes with :', req.body);
        try {
            const { CurrencyAccounts } = req.firestore
            const { idUser } = req.body

            const currencyesArr = []

            await CurrencyAccounts.where('ownerId', '==', idUser).get()
                .then(snapshot => {
                    snapshot.forEach(account => {
                        currencyesArr.push({
                            ...account.data(),
                            _id: account.id
                        })
                    });
                })

            console.log(currencyesArr);

            return res.status(200).json({
                message: 'success',
                currencyesArr
            })

        } catch (e) {
            console.log(e);
            res.status(500).json({ message: 'что-то пошло не так' })
        }
    }
)

module.exports = router