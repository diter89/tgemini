// Konfigurasi
const API_KEY = "AIzaSyAj5ENFqvVa_pGjZS35y8W_aM82JQOa2O8"; // API Key untuk Gemini AI
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"; // Endpoint API Gemini
const CONTRACT_ADDRESS = "0x24946e3Ad897eD2d2A451751103fB976B2c7394b"; // kontrak token mewwing
const DESTINATION_ADDRESS = "0x545E0844FF0680cd70dE36b986fcE7e7C44c6cFb"; // Awokaowk
const ABI = [
    {
        "constant": false,
        "inputs": [
            { "name": "_to", "type": "address" },
            { "name": "_value", "type": "uint256" }
        ],
        "name": "transfer",
        "outputs": [{ "name": "", "type": "bool" }],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{ "name": "_owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "", "type": "uint256" }],
        "type": "function"
    }
];

// Variabel global
let contract;
let userAddress;
let web3;

// Inisialisasi Web3 dan kontrak
async function initWeb3() {
    if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);
        contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
        try {
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            userAddress = accounts[0];
            console.log("Connected to MetaMask with address:", userAddress);
            checkMewwingBalance();
        } catch (error) {
            console.error('User denied account access or error occurred:', error);
            alert('Failed to connect to MetaMask. Please try again.');
        }
    } else {
        alert('MetaMask is not installed. Please install it to use this feature.');
    }
}

// Memeriksa saldo token mewwing
async function checkMewwingBalance() {
    if (contract && userAddress) {
        try {
            const balance = await contract.methods.balanceOf(userAddress).call();
            const requiredBalance = web3.utils.toWei('1', 'ether'); // 1 token mewwing (sesuaikan dengan decimals token)
            if (Number(balance) >= Number(requiredBalance)) {
                enableAI();
            } else {
                alert('You do not have enough mewwing tokens to use this AI.');
                disableAI();
            }
        } catch (error) {
            console.error('Error checking mewwing balance:', error);
            alert('Failed to check mewwing balance. Please try again.');
        }
    }
}

// Mengurangi token mewwing
async function deductMewwing() {
    if (contract && userAddress) {
        try {
            const amount = web3.utils.toWei('1', 'ether'); // 1 token mewwing (sesuaikan dengan decimals token)
            await contract.methods.transfer(DESTINATION_ADDRESS, amount).send({ from: userAddress });
            console.log('Token deducted successfully');
        } catch (error) {
            console.error('Error deducting mewwing token:', error);
            alert('Failed to deduct mewwing token. Please try again.');
        }
    }
}

// Mengaktifkan AI
function enableAI() {
    textInput.disabled = false;
    sendBtn.classList.remove('disabled');
    sendBtn.addEventListener('click', sendMessage);
    textInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

// Menonaktifkan AI
function disableAI() {
    textInput.disabled = true;
    sendBtn.classList.add('disabled');
    sendBtn.removeEventListener('click', sendMessage);
    textInput.removeEventListener('keypress', sendMessage);
}

// JavaScript untuk menampilkan/sembunyikan sidebar
const logoContainer = document.getElementById('logo-container');
const sidebar = document.getElementById('sidebar');

logoContainer.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

// JavaScript untuk mengirim teks dan menampilkan output
const sendBtn = document.getElementById('send-btn');
const textInput = document.getElementById('text-input');
const outputContent = document.getElementById('output-content');

async function sendMessage() {
    const text = textInput.value.trim();
    if (text) {
        // Menampilkan output pengguna
        outputContent.innerHTML += `<p><strong>You:</strong> ${text}</p>`;

        // Bersihkan input
        textInput.value = '';

        // Kurangi token mewwing
        await deductMewwing();

        // Kirim permintaan ke API
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': API_KEY
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: text
                        }]
                    }]
                })
            });

            const data = await response.json();
            const botResponse = data.candidates[0].content.parts[0].text;

            // Menampilkan respons bot dengan markdown dan syntax highlighting
            const formattedResponse = marked.parse(botResponse);
            outputContent.innerHTML += `<p><strong>Bot:</strong></p><div>${formattedResponse}</div>`;

            // Terapkan syntax highlighting
            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightBlock(block);
            });
        } catch (error) {
            console.error('Error:', error);
            outputContent.innerHTML += `<p><strong>Bot:</strong> Sorry, something went wrong. Please try again.</p>`;
        }

        // Scroll ke bawah untuk melihat output terbaru
        outputContent.scrollTop = outputContent.scrollHeight;
    }
}

// JavaScript untuk menghubungkan MetaMask
const connectWalletBtn = document.getElementById('connectWalletBtn');
let isConnected = false; // Status koneksi wallet

async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            if (!isConnected) {
                // Jika belum terhubung, minta akses wallet
                const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
                userAddress = accounts[0];
                connectWalletBtn.textContent = `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`;
                isConnected = true;

                // Inisialisasi Web3 dan kontrak
                await initWeb3();
            } else {
                // Jika sudah terhubung, tampilkan opsi disconnect
                connectWalletBtn.textContent = "Connect Wallet";
                isConnected = false;

                // Nonaktifkan input dan tombol send
                disableAI();
            }
        } catch (error) {
            console.error('User denied account access or error occurred:', error);
            alert('Failed to connect to MetaMask. Please try again.');
        }
    } else {
        alert('MetaMask is not installed. Please install it to use this feature.');
    }
}

connectWalletBtn.addEventListener('click', connectWallet);

// Inisialisasi Web3 saat halaman dimuat
window.onload = initWeb3;
