const router = require('express').Router()

const { compareDateDescending } = require('../middleware/sorter');


router.post(
    '/fetchActiveBills',
    async (req, res) => {
        console.log('fetchActiveBills with :', req.body);
        try {
            const { idUser } = req.body

            const { Transaction } = req.firestore

            const activeBills = []
            await Transaction
                .where('status', '==', 'active')
                .where('receiver.id', '==', idUser)
                .orderBy("registerDate", "desc")
                .get()

                .then(activeBillsRaw => {
                    activeBillsRaw.forEach(document => {
                        activeBills.push({
                            ...document.data(),
                            _id: document.id
                        })
                    })
                })
                .catch(e => console.log(e.message))

            if (activeBills.length == 0) {
                return res.status(204).json({
                    message: 'неоплаченных счетов нет'
                })
            } else {
                return res.status(200).json({
                    message: 'success',
                    activeBills
                })
            }

        } catch (e) {
            console.log(e);
            res.status(500).json({ message: 'что-то пошло не так' })
        }
    }
)

router.post(
    '/fetchClosedBills',
    async (req, res) => {
        console.log('fetchClosedBills with :', req.body);
        try {
            const { idUser } = req.body
            const { Transaction } = req.firestore

            const closedBills = []

            await Transaction
                .where('status', '!=', 'active')
                .where('sender.id', '==', idUser)
                .get()

                .then(closedBillsRaw => {
                    closedBillsRaw.forEach(document => {
                        closedBills.push({
                            ...document.data(),
                            _id: document.id
                        })
                    })
                })
                .catch(e => {
                    console.log(e.message)
                    return res.status(500).json({ message: 'что-то пошло не так' })
                })

            await Transaction
                .where('status', '!=', 'active')
                .where('receiver.id', '==', idUser)
                .get()

                .then(closedBillsRaw => {
                    closedBillsRaw.forEach(document => {
                        closedBills.push({
                            ...document.data(),
                            _id: document.id
                        })
                    })
                })
                .catch(e => {
                    console.log(e.message)
                    return res.status(500).json({ message: 'что-то пошло не так' })
                })

            closedBills.sort(compareDateDescending)

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
            const { Transaction } = req.firestore

            const endDate = new Date(timeRange.date2).setHours(23, 59, 59)
            const beginDate = new Date(timeRange.date1).setHours(00, 00, 00)

            const billsByCategory = []

            if (category == 'received') {
                await Transaction
                    .where('receiver.id', '==', idUser)
                    .where('registerDate', '>=', beginDate)
                    .where('registerDate', '<=', endDate)
                    .orderBy('registerDate', 'Desc')
                    .get()

                    .then(billsByCategoryRaw => {
                        billsByCategoryRaw.forEach(billRef => {
                            const bill = {
                                ...billRef.data(),
                                _id: billRef.id
                            }
                            if (bill.type !== 'Wallet (конвертация)') {
                                billsByCategory.push(bill)
                            }
                        });
                    })
                    .catch(e => console.log(e.message))
            }
            else {
                await Transaction
                    .where('sender.id', '==', idUser)
                    .where('registerDate', '>=', beginDate)
                    .where('registerDate', '<=', endDate)
                    .orderBy('registerDate', 'Desc')
                    .get()

                    .then(billsByCategoryRaw => {
                        billsByCategoryRaw.forEach(billRef => {
                            const bill = {
                                ...billRef.data(),
                                _id: billRef.id
                            }
                            if (bill.type !== 'Wallet (конвертация)') {
                                billsByCategory.push(bill)
                            }
                        });
                    })
                    .catch(e => console.log(e.message))
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

router.post(
    '/fetchAvailableCurrencies',
    async (req, res) => {
        console.log('fetchAvailableCurrencies with :', req.body);
        try {
            const { WalletConfig } = req.firestore
            const resRef = await WalletConfig.doc('availableCurrencies').get()
            if (resRef != null) {
                const availableCurrencies = resRef.data().arr
                return res.status(200).json({
                    message: 'success',
                    availableCurrencies
                })
            }else{
                throw new Error('не найден документ в БД')
            }
        } catch (e) {
            console.log(e);
            res.status(500).json({ message: 'что-то пошло не так' })
        }
    }
)



module.exports = router