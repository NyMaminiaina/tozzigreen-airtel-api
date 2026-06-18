var express = require('express');
var cors = require('cors');
var mongoose = require('mongoose');

var app = express();
app.use(cors());
app.use(express.json());

var MONGO_URI = 'mongodb+srv://tozzigreen:TozziGreen2026@cluster0.hn37cur.mongodb.net/tozzigreen?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
    .then(function () { console.log('MongoDB OK'); })
    .catch(function (err) { console.error('MongoDB:', err.message); });

var Transaction = mongoose.model('Transaction', {
    transaction_id: { type: String, required: true, unique: true },
    reference_client: String,
    montant_paye: Number,
    telephone_payeur: String,
    timestamp: String,
    code_recharge: String,
    status: { type: String, default: 'SUCCESS' },
    created_at: { type: Date, default: Date.now }
});

app.post('/api/airtel/validate-amount', function (req, res) {
    var montant = Number(req.body.montant_saisi);
    if (isNaN(montant) || montant < 20000) return res.json({ status: 'REFUSED', reason: 'Montant trop bas' });
    if (montant > 70000) return res.json({ status: 'REFUSED', reason: 'Montant trop eleve' });
    return res.json({ status: 'OK' });
});

app.post('/api/airtel/payment', async function (req, res) {
    var ref = req.body.reference_client;
    var montant = req.body.montant_paye;
    var num = req.body.numero_transaction;
    var tel = req.body.telephone_payeur;
    var ts = req.body.timestamp;

    try {
        var existant = await Transaction.findOne({ transaction_id: num });
        if (existant) return res.json({ status: 'ERROR', message: 'Transaction deja traitee' });

        var codeRecharge = 'CODE-' + Date.now();

        await Transaction.create({
            transaction_id: num, reference_client: ref, montant_paye: montant,
            telephone_payeur: tel, timestamp: ts, code_recharge: codeRecharge, status: 'SUCCESS'
        });

        return res.json({ status: 'OK', code_recharge: codeRecharge, transaction_id: num });
    } catch (err) {
        return res.json({ status: 'ERROR', message: err.message });
    }
});

app.post('/api/airtel/transaction-status', async function (req, res) {
    try {
        var tx = await Transaction.findOne({ transaction_id: req.body.transaction_id });
        if (!tx) return res.json({ status: 'NOT_FOUND' });
        return res.json({ status: tx.status, transaction_id: tx.transaction_id, code_recharge: tx.code_recharge });
    } catch (err) {
        return res.json({ status: 'ERROR', message: err.message });
    }
});

app.get('/', function (req, res) {
    res.json({ status: 'OK', service: 'TozziGreen Airtel API' });
});

app.listen(process.env.PORT || 3000, function () {
    console.log('Serveur OK');
});