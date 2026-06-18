const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const transactions = new Map();

app.post('/api/airtel/validate-amount', function (req, res) {
    const montant = Number(req.body.montant_saisi);
    if (isNaN(montant) || montant < 20000) {
        return res.json({ status: 'REFUSED', reason: 'Montant trop bas' });
    }
    if (montant > 70000) {
        return res.json({ status: 'REFUSED', reason: 'Montant trop eleve' });
    }
    return res.json({ status: 'OK' });
});

app.post('/api/airtel/payment', function (req, res) {
    const { reference_client, montant_paye, numero_transaction, telephone_payeur, timestamp } = req.body;
    if (transactions.has(numero_transaction)) {
        return res.json({ status: 'ERROR', message: 'Transaction deja traitee' });
    }
    const codeRecharge = 'CODE-' + Date.now();
    transactions.set(numero_transaction, { reference_client, montant_paye, telephone_payeur, timestamp, code_recharge: codeRecharge, status: 'SUCCESS' });
    return res.json({ status: 'OK', code_recharge: codeRecharge, transaction_id: numero_transaction });
});

app.post('/api/airtel/transaction-status', function (req, res) {
    const tx = transactions.get(req.body.transaction_id);
    if (!tx) return res.json({ status: 'NOT_FOUND' });
    return res.json({ status: tx.status, transaction_id: req.body.transaction_id, code_recharge: tx.code_recharge });
});

app.get('/', function (req, res) {
    res.json({ status: 'OK', service: 'TozziGreen Airtel API' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log('Serveur OK');
});