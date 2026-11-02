# 没歌词时自己识别：离线 ASR 流程

`new_project.py` 找歌词的顺序是：lrclib.net → 本地 faster-whisper。lrclib 在国内经常连不上，
faster-whisper 又常常装不上（下面有原因和绕法）。这一页就是「两条都不顺时怎么办」。

目标产物只有一个：`data/lyrics.lrc`。拿到它，`new_project.py ... --lrc data/lyrics.lrc` 就能重建成片，
重建不会覆盖 `plan.json`、`shots.js`、`index.html`。

## 一、装（跳过两个坑）

```bash
# 1) 纯 python 的先装掉
python -m pip install tqdm coloredlogs humanfriendly httpx2 fsspec hf-xet packaging pyyaml

# 2) 要轮子的，别让 pip 现编
python -m pip install --only-binary :all: --no-deps av ctranslate2 tokenizers huggingface-hub

# 3) 主包不拉依赖，避免把 onnxruntime 拖进来
python -m pip install --no-deps faster-whisper
```

两个坑：

- **`av`（PyAV）没有对应平台的轮子时会现编 Cython**，在 Windows + 3.12 上直接
  `CompileError: av\logging.pyx`。`--only-binary :all:` 能保证它要么装好轮子、要么当场报错，不会卡在编译。
- **`onnxruntime` 会和已有的 protobuf 撞版本**，而它只给 VAD 用。不装也行：
  `fetch_lyrics.py` 和 `asr_lyrics.py` 都会检测 `onnxruntime`，没有就自动 `vad_filter=False`。

## 二、下模型（不经过 huggingface_hub）

```bash
python scripts/fetch_ct2_model.py small                # -> ./models/faster-whisper-small
python scripts/fetch_ct2_model.py medium ./models/fw-m # 也可以指定目录
```

为什么不用 `WhisperModel('small')` 让它自己下：那会走 huggingface_hub，2.x 版本多两个依赖
（`httpx2`、`hf-xet`），而且在这个网络下经常下到 89% 断流。`fetch_ct2_model.py` 直接拉 5 个文件
（`config.json` / `model.bin` / `tokenizer.json` / `vocabulary.txt` / `preprocessor_config.json`），
hf-mirror.com 优先、`huggingface.co` 兜底，有 curl 就 `curl -C -` 续传。

模型大小参考：small 约 461 MB，medium 约 1.5 GB。

## 三、识别

```bash
python scripts/asr_lyrics.py song.mp3 data/lyrics.lrc                       # 用 models/ 里的模型
VOXEL_ASR_MODEL=D:/models/fw-m python scripts/asr_lyrics.py song.mp3 a.lrc  # 指定模型目录
VOXEL_ASR_DEVICE=cuda python scripts/asr_lyrics.py song.mp3 a.lrc           # 有显卡（fp16）
```

也可以直接让 `fetch_lyrics.py` 走本地模型（`models/faster-whisper-<name>` 会被自动优先使用）。

实现上有两点和默认不同：

- **不走 PyAV 解码**。faster-whisper 1.2 调 `av.open(..., metadata_errors=...)`，新版 PyAV 已经删了这个参数，
  会 `TypeError`。这里先用 ffmpeg 解成 16k 单声道 wav，再把 numpy 数组喂给 `transcribe()`。
- **不开 VAD**。省掉 onnxruntime，安静段落不会被切掉太多（代价是纯音乐段可能出幻觉句）。

## 四、识别结果一定要人工核

歌唱 + 伴奏，small / medium 都会错字，断句也不准。实测一句「跨越过多少海洋去看你」会被识别成
「把越过多小孩子去看过」。但**句子的时间轴是对的**，所以正确用法是：

1. 拿识别结果里一两句像样的（哪怕只有半句）去搜歌名，确认是哪首歌；
2. 找到真歌词，把文字换掉、**保留识别出来的时间**；
3. 存成 `data/lyrics.lrc`，`--lrc` 重建项目。

```lrc
[00:00.20]跨越过多少海洋去看你
[00:03.40]孤单的黑夜途中
```

## 五、常见报错

| 现象 | 原因 / 办法 |
|---|---|
| `Cython.Compiler.Errors.CompileError: av\logging.pyx` | 没有轮子，改用 `--only-binary :all:` 装 `av` |
| `ModuleNotFoundError: No module named 'httpx2'` / `hf_xet` | huggingface_hub 2.x 的新依赖，按上面第 1 步补齐 |
| `MetadataIncompleteBuffer` / `invalid payload size` | 模型文件没下完整，删掉 `models/.../model.bin` 重下（用 `fetch_ct2_model.py`） |
| `TypeError: open() got an unexpected keyword argument 'metadata_errors'` | PyAV 版本太新，用 `asr_lyrics.py`（ffmpeg 解码），别直接 `transcribe(文件路径)` |
| 只识别出 1–2 句 | 纯音乐 / 人声太小；换 `medium`，或者装 `demucs` 先分离人声 |
| 句子时间偏早 0.1–0.2 秒 | ASR 句边界本来就偏早，手改 `data/lyrics.lrc` 即可 |
