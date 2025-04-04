import jwt from 'jsonwebtoken'

// doctor authentication middleware
const authDoctor = async (req, res , next) => {
    try {
        // getting the token from the headers
        const {dtoken} = req.headers

        // checking if the token is provided
        if(!dtoken){
            return res.json({ success: false, message: "Not Authorized Login Again" })
        }

        // verifying the token
        const token_decode = jwt.verify(dtoken , process.env.JWT_SECRET)
        req.body.docId = token_decode.id

        // calling the next middleware to continue the request
        next()
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

export default authDoctor