const videoElement = document.getElementsByClassName("input_video")[0];
const canvasElement = document.getElementsByClassName("output_canvas")[0];
const canvasCtx = canvasElement.getContext("2d");

// カウンターの初期化
let action1Counter = 0;
let snowflakes = [];
let santaPosition = canvasElement.width;
let santaVisible = false;

// 手の位置を保存する変数
let previousHandX = null;

// 背景画像とサンタクロース画像の読み込み
const backgroundImage = new Image();
backgroundImage.src = "images/background.jpg";

const santaImage = new Image();
santaImage.src = "images/santa.png";

// 雪を降らせる関数
function createSnowflake() {
    const x = Math.random() * canvasElement.width;
    const size = Math.random() * 5 + 2;
    const speed = Math.random() * 2 + 1;
    snowflakes.push({ x, y: 0, size, speed });
}

function updateSnowflakes() {
    // 背景画像を描画
    canvasCtx.drawImage(backgroundImage, 0, 0, canvasElement.width, canvasElement.height);

    // 雪の更新と描画
    snowflakes.forEach((snowflake, index) => {
        snowflake.y += snowflake.speed;
        if (snowflake.y > canvasElement.height) {
            snowflakes.splice(index, 1); // 画面外に出た雪を削除
        } else {
            canvasCtx.beginPath();
            canvasCtx.arc(snowflake.x, snowflake.y, snowflake.size, 0, Math.PI * 2);
            canvasCtx.fillStyle = "white";
            canvasCtx.fill();
        }
    });

    // サンタクロースを描画
    if (santaVisible) {
        canvasCtx.drawImage(santaImage, santaPosition, canvasElement.height - 150, 100, 100);
        santaPosition -= 5; // サンタが左に移動
        if (santaPosition < -100) {
            santaVisible = false; // サンタが画面外に出たら非表示
            santaPosition = canvasElement.width; // 初期位置に戻す
        }
    }

    // 再描画
    requestAnimationFrame(updateSnowflakes);
}

// Mediapipe の結果処理
const onResults = (results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const hand = results.multiHandLandmarks[0]; // 最初の手を取得
        const currentHandX = hand[0].x; // 手首のX座標

        // 手を振る動きを検出
        if (previousHandX !== null) {
            const deltaX = Math.abs(currentHandX - previousHandX);
            if (deltaX > 0.1) { // 手を振る動きのしきい値
                santaVisible = true; // サンタを表示
            }
        }
        previousHandX = currentHandX; // 現在の位置を保存

        const hand1IndexFingerTop = results.multiHandLandmarks[0][8];
        if (results.multiHandLandmarks.length > 1) {
            const hand2IndexFingerTop = results.multiHandLandmarks[1][8];
            const IndexFingerDistance = Math.sqrt(
                Math.pow(hand1IndexFingerTop.x * canvasElement.width - hand2IndexFingerTop.x * canvasElement.width, 2) +
                Math.pow(hand1IndexFingerTop.y * canvasElement.height - hand2IndexFingerTop.y * canvasElement.height, 2)
            );

            if (IndexFingerDistance <= 50) {
                action1Counter += 1;

                if (action1Counter >= 50) { // 雪が降り始める条件
                    createSnowflake();
                }
            } else {
                action1Counter = 0;
            }
        }
    }
};

const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    },
});

hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
});

hands.onResults(onResults);

// カメラの映像を処理だけする（画面には表示しない）
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 1280,
    height: 720,
});

// カメラ映像を非表示
videoElement.style.display = "none";

// 背景画像の描画開始
backgroundImage.onload = () => {
    updateSnowflakes();
};

camera.start();
