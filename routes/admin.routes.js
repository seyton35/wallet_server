const Request = require("../models/Request")

const router = require("express").Router()

router.post(
    '/deleteAllRequests',
    async (req, res) => {
        const result = await Request.deleteMany()
        res.json({
            message: result
        })
    }
)

router.post(
    '/make10Requests',
    async (req, res) => {
        try {

            for (let index = 0; index < 5; index++) {
                const data = {
                    type: 'Перевод на Wallet',
                    sender: {
                        id: '639f887fea2baaf164a4f1d1',
                        number: 79782023076,
                        sum: Math.floor(Math.random() * 100),
                        currency: 'UAH',
                    },
                    receiver: {
                        id: '6383c05b1087d1dd78957cdf',
                        number: 79782023073
                    },
                    comment: 'comm ' + Math.floor(Math.random() * 100)
                }
                const moneyRequstUAH = new Request(data)
                await moneyRequstUAH.save()
                data.sender.currency = 'RUB'
                const moneyRequstRUB = new Request(data)
                await moneyRequstRUB.save()
            }
            res.json({
                message: 'ok'
            })

        } catch (e) {
            res.json({
                message: 'err'
            })
        }
    }
)

module.exports = router