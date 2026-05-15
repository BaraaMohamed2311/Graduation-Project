```bash
nohup python3 scale.py > autoscaler.log 2>&1 &
```

Start script in background, ignore terminal close, log output to file

```bash
pkill -f scale.py
```

Stop the running script by matching its process name
