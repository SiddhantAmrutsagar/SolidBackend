//using promises
//its an wrapper in which every time we call the function we can handle the request and response

const asyncHandler = (requestHandler) => {
    return (req, res, next) =>{
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