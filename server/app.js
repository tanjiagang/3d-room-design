const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// 启用跨域和JSON解析
app.use(cors());
app.use(express.json());

const modelRouter = require('./routers/models');
app.use('/api/models', modelRouter);

// 示例接口
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express!' });
});

// 启动服务
app.listen(port, () => {
  console.log(`Express server running at http://localhost:${port}`);
});
