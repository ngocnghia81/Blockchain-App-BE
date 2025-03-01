const app = require("./app");
const PORT = process.env.PORT || 3000;
require("dotenv").config();

app.listen(PORT, () => console.log(`API running on port ${PORT}`));
