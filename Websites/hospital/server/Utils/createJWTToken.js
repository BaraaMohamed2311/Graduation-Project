const jwt = require("jsonwebtoken");


function createJWTToken(id,email){
    try{
        const token = jwt.sign({user_id:id,user_email:email},process.env.SECRET_KEY,{ expiresIn: '2h' })
        return token
    }

    catch(err){
        consoleLog(`Error catch create Token ${err}` , err)
    }
    
}


module.exports = createJWTToken;