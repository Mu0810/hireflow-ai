import { app } from "./app";
import { env } from "./config/env";

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
