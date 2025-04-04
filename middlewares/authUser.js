import jwt from 'jsonwebtoken'

// user authentication middleware
const authUser = async (req, res , next) => {
    try {
        // getting the token from the headers
        const {token} = req.headers

        // checking if the token is provided
        if(!token){
            return res.json({ success: false, message: "Not Authorized Login Again" })
        }

        // verifying the token
        const token_decode = jwt.verify(token , process.env.JWT_SECRET)
        req.body.userId = token_decode.id

        // calling the next middleware to continue the request
        next()
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

export default authUser