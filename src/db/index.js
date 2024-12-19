import mongoose from "mongoose";

const dbConnect = async () => {
    console.log(process.env.MONGODB_URI)
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/BlogApp`);
        console.log(`Database Connected Successfully ${connectionInstance.connection}`);
    } catch (error) {
        console.error(`Database Connection Failed ${error}`)
        process.exit(1);
    }
}

export default dbConnect;
