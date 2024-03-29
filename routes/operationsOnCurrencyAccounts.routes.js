const router = require('express').Router()

router.post(
    '/openCurrencyAccount',
    async (req, res) => {
        console.log('openCurrencyAccount with :', req.body);
        try {
            const { CurrencyAccounts } = req.firestore
            const { idUser, currency } = req.body

            const currencyAccount = await CurrencyAccounts.add({
                ownerId: idUser,
                type: currency,
                count: 0,
                registerDate: Date.now(),
            })

            if (currencyAccount.id != null) {
                return res.status(200).json({
                    message: 'success',
                })
            }else throw new Error('счет не открыт!')

        } catch (e) {
            console.log(e);
            res.status(500).json({ message: 'что-то пошло не так' })
        }
    }
)

module.exports = router
