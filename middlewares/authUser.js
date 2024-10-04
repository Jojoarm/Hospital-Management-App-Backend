import jwt from 'jsonwebtoken';

// user authentication
const authUser = async (req, res, next) => {
  try {
    const { utoken } = req.headers;
    if (!utoken) {
      return res.json({ success: false, message: 'Not authorized' });
    }

    const decoded_token = jwt.verify(utoken, process.env.JWT_SECRET);
    req.body.userId = decoded_token.id;
    next();
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export default authUser;
