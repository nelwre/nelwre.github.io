const { FFmpeg, fetchFile } = FFmpeg;

const ffmpeg = new FFmpeg.FFmpeg();
let fileData = null;
let fileName = '';

// Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileNameEl = document.getElementById('fileName');
const fileSizeEl = document.getElementById('fileSize');
const optionsSection = document.getElementById('optionsSection');
const convertBtn = document.getElementById('convertBtn');
const downloadBtn = document.getElementById('downloadBtn');
const progressSection = document.getElementById('progressSection');
const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');
const progressPercent = document.getElementById('progressPercent');
const message = document.getElementById('message');

// Initialize
async function initFFmpeg() {
    try {
        if (!ffmpeg.isLoaded()) {
            message.textContent = '📥 Downloading FFmpeg (30MB)...';
            message.classList.remove('error', 'success', 'info');
            message.classList.add('info');
            
            await ffmpeg.load();
            
            message.textContent = '✅ Ready to convert!';
            message.classList.remove('error', 'info');
            message.classList.add('success');
            setTimeout(() => message.textContent = '', 2000);
        }
    } catch (error) {
        showError('Failed to load FFmpeg: ' + error.message);
    }
}

// File handling
uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    if (e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type === 'audio/wav' || file.name.endsWith('.wav')) {
            handleFile(file);
        } else {
            showError('Please upload a WAV file');
        }
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

async function handleFile(file) {
    fileData = await file.arrayBuffer();
    fileName = file.name.replace('.wav', '');
    
    fileNameEl.textContent = file.name;
    fileSizeEl.textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
    
    uploadArea.style.display = 'none';
    fileInfo.style.display = 'block';
    optionsSection.style.display = 'block';
    convertBtn.style.display = 'block';
    downloadBtn.style.display = 'none';
    convertBtn.disabled = false;
}

// Conversion
convertBtn.addEventListener('click', startConversion);

async function startConversion() {
    if (!fileData) {
        showError('No file selected');
        return;
    }

    await initFFmpeg();
    
    convertBtn.disabled = true;
    optionsSection.style.display = 'none';
    progressSection.style.display = 'block';
    downloadBtn.style.display = 'none';
    message.textContent = '';

    try {
        const format = document.querySelector('input[name="format"]:checked').value;
        const videoType = document.querySelector('input[name="videoType"]:checked').value;
        const fps = parseInt(document.getElementById('fps').value);
        const resolution = document.getElementById('resolution').value;

        // Write input file
        progressText.textContent = 'Writing audio file...';
        updateProgress(10);
        
        ffmpeg.FS('writeFile', 'input.wav', new Uint8Array(fileData));

        // Get audio info
        progressText.textContent = 'Analyzing audio...';
        updateProgress(20);

        await ffmpeg.exec(['-i', 'input.wav']);

        // Create video
        await createVideo(format, videoType, fps, resolution);

        progressText.textContent = '✅ Conversion complete!';
        updateProgress(100);
        convertBtn.disabled = false;
        downloadBtn.style.display = 'block';
        showSuccess('Ready to download!');

    } catch (error) {
        showError('Conversion error: ' + error.message);
        convertBtn.disabled = false;
    }
}

async function createVideo(format, videoType, fps, resolution) {
    const [width, height] = resolution.split('x').map(Number);
    let outputFile, videoCodec = 'libx264', audioCodec, audioExtension;

    // Audio codec selection
    if (format === 'mkv') {
        outputFile = fileName + '.mkv';
        audioCodec = 'flac';
        audioExtension = 'flac';
    } else if (format === 'mov-pcm') {
        outputFile = fileName + '.mov';
        audioCodec = 'pcm_s16le';
        audioExtension = 'pcm';
    } else {
        outputFile = fileName + '.mov';
        audioCodec = 'pcm_s16le';
        audioExtension = 'wav';
    }

    progressText.textContent = 'Creating video...';
    updateProgress(30);

    let filterGraph = '';

    // Video filter based on type
    if (videoType === 'black') {
        filterGraph = `color=c=black:s=${width}x${height}:d=[duration]`;
    } else if (videoType === 'waveform') {
        filterGraph = `aformat=channel_layouts=mono,
            showwaves=s=${width}x${height}:mode=cline:rate=${fps}:colors=00ff00`;
    } else if (videoType === 'gradient') {
        filterGraph = `color=c='#667eea':s=${width}x${height}:d=[duration]`;
    }

    progressText.textContent = 'Encoding video...';
    updateProgress(50);

    // FFmpeg command
    const cmd = [
        '-f', 'lavfi',
        '-i', filterGraph,
        '-i', 'input.wav',
        '-c:v', videoCodec,
        '-preset', 'ultrafast',
        '-crf', '0',
        '-c:a', audioCodec,
        '-q:a', '9',
        '-pix_fmt', 'yuv420p',
        '-r', fps.toString(),
        '-t', '0', // Will be set properly
        '-shortest',
        outputFile
    ];

    await ffmpeg.exec(cmd);

    progressText.textContent = 'Finalizing...';
    updateProgress(90);
}

function updateProgress(percent](#)*
      
