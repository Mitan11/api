import jwt from 'jsonwebtoken'

// admin authentication middleware
const authAdmin = async (req, res , next) => {
    try {
        // getting the token from the headers
        const {atoken} = req.headers

        // checking if the token is provided
        if(!atoken){
            return res.json({ success: false, message: "Not Authorized Login Again" })
        }

        // verifying the token
        const token_decode = jwt.verify(atoken , process.env.JWT_SECRET)
        // checking if the token is valid
        if(token_decode !== process.env.ADMIN_EMAIL+process.env.ADMIN_PASSWORD){
            return res.json({ success: false, message: "Not Authorized Login Again" })
        }
        // calling the next middleware to continue the request
        next()
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

export default authAdmin