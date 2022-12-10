const router = require('express').Router()

const Request = require('../models/Request')

router.post(
    '/IssuedInvoices',
    async (req, res) => {
        console.log('fetching invoices with :', req.body);
        try {
            const { idUser } = req.body

            const issuedInvoicesArr = await Request.find({ "receiver.id": idUser })
            if (!issuedInvoicesArr) {
                return res.status(204).json({
                    message: 'неоплаченных счетов нет'
                })
            }
            return res.json({
                message: 'success',
                issuedInvoicesArr
            })

        } catch (e) {
            console.log(e);
            res.status(500).json({ message: 'что-то пошло не так' })
        }
    }
)

module.exports = router