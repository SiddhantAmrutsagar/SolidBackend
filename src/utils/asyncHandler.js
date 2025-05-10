//using promises
const asyncHandler = (requestHandler) => {
    (req, res, next) =>{
        Promise.resolve(requestHandler(req, res, next)).
        catch((err)=> next(err))
    }
}





export {asyncHandler}

//high order function
// This function takes a function as an argument and returns a new function


// using try catch block

// const asyncHandler = (fn) => async (req, res, next) =>{
//     try {
        
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//     })
// }}