const router = require('express').Router()
const config = require('config')
const adminPanel = config.get('adminPanel')

router.post(
    '/sendScript',
    async (req, res) => {
        console.log('sendScript with :', req.body);
        try {
            const { password } = req.body

            if (adminPanel !== password) {
                return res.status(403).json({
                    message: 'access denided'
                })
            }

            const { Users, messaging } = req.firestore

            await Users.where('phoneNumber', '==', 79782023073).get()
                .then(snapshot => {
                    snapshot.forEach(docRef => {
                        const doc = docRef.data()
                        if (doc.tokens.length != 0) {
                            messaging.sendToDevice(
                                doc.tokens,
                                {
                                    data: {
                                        command: "logOut",
                                        commandMessage:'commandMessage'
                                    },
                                    notification: {
                                        title: 'hellow',
                                        body: ';orld'
                                    }
                                }
                            )
                                .catch(e => {
                                    console.log(e.message);
                                })
                        }
                    });
                })
                .catch(e => {
                    console.log('error:', e.message)
                })
            return res.json({
                message: 'complete'
            })


        } catch (e) {
            console.log(e);
            res.status(500).json({ message: 'что-то пошло не так' })
        }
    }
)

module.exports = router