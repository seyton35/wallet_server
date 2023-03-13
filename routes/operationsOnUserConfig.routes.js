const router = require('express').Router()

router.post(
    '/postDefaultCurrencyAccount',
    async (req, res) => {
        console.log('postDefaultCurrencyAccount with :', req.body);
        try {
            const { UserConfig } = req.firestore
            const { currency, idUser } = req.body

            await UserConfig.doc(idUser).update({
                defaultCurrencyAccount: currency
            })
            res.status(200).json({
                message: 'success'
            })

        } catch (e) {
            console.log(e);
            res.status(500).json({ message: 'что-то пошло не так' })
        }
    }
)

router.post(
    '/postPushNotificationSettings',
    async (req, res) => {
        console.log('postPushNotificationSettings with :', req.body);
        try {
            const { UserConfig } = req.firestore
            const { pushNotificationSettings, idUser } = req.body

            await UserConfig.doc(idUser).update({
                pushNotificationSettings: pushNotificationSettings
            })
            res.status(200).json({
                message: 'success'
            })

        } catch (e) {
            console.log(e);
            res.status(500).json({ message: 'что-то пошло не так' })
        }
    }
)

router.post(
    '/postLanguage',
    async (req, res) => {
        console.log('postLanguage with :', req.body);
        try {
            const { UserConfig } = req.firestore
            const { language, idUser } = req.body

            await UserConfig.doc(idUser).update({
                language: language
            })
            console.log('language changed');
            res.status(300).json({
                message: 'success'
            })

        } catch (e) {
            console.log(e);
            res.status(500).json({ message: 'что-то пошло не так' })
        }
    }
)

module.exports = router
