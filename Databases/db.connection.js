import mongoose from "mongoose";
export const dbConnection = () => {
  console.log(process.env.DB_URL);
  mongoose
    .connect(process.env.DATABASE_URL)
    .then(() => console.log("DB connected"))
    .catch((err) => console.log(err));
};
