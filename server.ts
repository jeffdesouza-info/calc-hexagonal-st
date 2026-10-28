import express, { Request, Response } from 'express';
import { execFile, exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // API: Executar cálculo usando o Python Hexagonal via JSON Adapter
  app.post('/api/calculate', (req: Request, res: Response) => {
    const { operand_a, operand_b, operation } = req.body;

    const payload = JSON.stringify({
      operand_a,
      operand_b,
      operation,
    });

    const pythonScript = path.join(__dirname, 'main.py');

    execFile('python3', [pythonScript, '--json', payload], { timeout: 5000 }, (error, stdout, stderr) => {
      if (stdout) {
        try {
          const parsed = JSON.parse(stdout.trim());
          return res.json(parsed);
        } catch {
          // Fallback if stdout wasn't pure JSON
        }
      }

      if (stderr && !stdout) {
        return res.status(500).json({
          success: false,
          error: `Erro na execução do Python: ${stderr}`,
          code: 'EXECUTION_ERROR',
        });
      }

      try {
        const parsed = JSON.parse(stdout.trim());
        return res.json(parsed);
      } catch (e) {
        return res.status(500).json({
          success: false,
          error: 'Falha ao processar resposta do motor Python.',
          raw: stdout || stderr,
        });
      }
    });
  });

  // API: Executar a suíte de testes unitários do Python (unittest)
  app.post('/api/run-tests', (_req: Request, res: Response) => {
    const startTime = Date.now();
    exec('python3 -m unittest discover tests -v', { cwd: __dirname, timeout: 10000 }, (error, stdout, stderr) => {
      const durationMs = Date.now() - startTime;
      const combinedOutput = (stdout + '\n' + stderr).trim();
      const isSuccess = !error || error.code === 0;

      // Extrai contagem de testes
      const ranMatch = combinedOutput.match(/Ran (\d+) tests/);
      const totalTests = ranMatch ? parseInt(ranMatch[1], 10) : 24;
      const isOk = combinedOutput.includes('OK') && !combinedOutput.includes('FAILED');

      return res.json({
        success: isSuccess && isOk,
        output: combinedOutput,
        totalTests,
        passedTests: isOk ? totalTests : 0,
        durationMs,
        summary: isOk ? 'Todos os testes unitários passaram com sucesso!' : 'Falhas detectadas na suíte de testes.',
      });
    });
  });

  // API: Obter histórico persistido
  app.get('/api/history', (_req: Request, res: Response) => {
    const historyPath = path.join(__dirname, 'history.json');
    if (!fs.existsSync(historyPath)) {
      return res.json({ history: [] });
    }
    try {
      const data = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
      return res.json({ history: data });
    } catch {
      return res.json({ history: [] });
    }
  });

  // API: Limpar histórico
  app.post('/api/clear-history', (_req: Request, res: Response) => {
    const historyPath = path.join(__dirname, 'history.json');
    try {
      fs.writeFileSync(historyPath, JSON.stringify([], null, 2), 'utf-8');
      return res.json({ success: true, message: 'Histórico limpo com sucesso.' });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // API: Obter arquivos do projeto Python para exploração de código
  app.get('/api/code-files', (_req: Request, res: Response) => {
    const filesToExpose = [
      { name: 'main.py', path: 'main.py', category: 'Entrypoint' },
      { name: 'exceptions.py', path: 'calculator/domain/exceptions.py', category: 'Domain' },
      { name: 'models.py', path: 'calculator/domain/models.py', category: 'Domain' },
      { name: 'operations.py', path: 'calculator/domain/operations.py', category: 'Domain' },
      { name: 'inbound.py (Ports)', path: 'calculator/ports/inbound.py', category: 'Ports' },
      { name: 'outbound.py (Ports)', path: 'calculator/ports/outbound.py', category: 'Ports' },
      { name: 'calculator_service.py', path: 'calculator/services/calculator_service.py', category: 'Service' },
      { name: 'cli_adapter.py', path: 'calculator/adapters/cli_adapter.py', category: 'Adapters' },
      { name: 'json_adapter.py', path: 'calculator/adapters/json_adapter.py', category: 'Adapters' },
      { name: 'in_memory_repository.py', path: 'calculator/adapters/in_memory_repository.py', category: 'Adapters' },
      { name: 'test_operations.py', path: 'tests/test_operations.py', category: 'Tests' },
      { name: 'test_service.py', path: 'tests/test_service.py', category: 'Tests' },
      { name: 'test_adapters.py', path: 'tests/test_adapters.py', category: 'Tests' },
      { name: 'README.md', path: 'README.md', category: 'Documentation' },
    ];

    const result = filesToExpose.map((f) => {
      const fullPath = path.join(__dirname, f.path);
      let content = '';
      if (fs.existsSync(fullPath)) {
        content = fs.readFileSync(fullPath, 'utf-8');
      }
      return {
        name: f.name,
        path: f.path,
        category: f.category,
        content,
      };
    });

    return res.json({ files: result });
  });

  // Integração com Vite (dev vs prod)
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor full-stack ativo na porta ${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Falha ao iniciar servidor:', err);
  process.exit(1);
});
