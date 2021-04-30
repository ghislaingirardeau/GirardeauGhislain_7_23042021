const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

/* CONNECTION MYSQL */
const mysql = require('mysql');
const config = require('../config');
const connection = mysql.createConnection(config);

const salt = 10

exports.signup = (req, res, next) => { 

    var buffer = Buffer.from(req.body.email, "base64");

    bcrypt.hash(req.body.password, salt)
    .then(hash => {

        const sql = `INSERT INTO Users (pseudo, email, password) 
            VALUES ("${req.body.pseudo}", "${buffer}", "${hash}");`;
        connection.query(sql, (error, results, fields) => {
            if (error) {
                res.status(400).json({message: 'Ce pseudo existe deja'})
            }
            else if(results){
                res.status(201).json({message: 'user créé'})
            }
        });
    })
    .catch(() => res.status(400).json({message: 'Echec'}))
}

/* CLE TOKEN A MASQUER */
exports.login = (req, res, next) => { 
   
    const sql = `SELECT * FROM Users WHERE pseudo="${req.body.pseudo}"`;
    connection.query(sql, (error, results, fields) => {
        if (results.length == 0 || error) {
            res.status(400).json({message: "Ce pseudo n'existe pas"})
        }
        else if(results.length > 0){
                bcrypt.compare(req.body.password, results[0].password)
            .then(valid => {
                if (!valid){
                return res.status(400).json({message: "Ce mot de passe n'est pas valide"})
                }
                res.status(200).json({
                userId: results[0].id,
                    token: jwt.sign(
                    {userId: results[0].id}, `CLE TOKEN SECRET GROUPOMANIA`,
                    { expiresIn: '24h'})  
                })
            })
            .catch(() => res.status(500).json({message: "erreur login"}))
        }           
    });
}

exports.deleteAccount= (req, res, next) => { /* A SUPPR DU COMPTE ON DELETE CASCADE supprime les sujets et commentaires lies au compte */
   
    var buffer = Buffer.from(req.body.email, "base64");
    
    const sql = `SELECT password FROM Users WHERE email="${buffer}" AND pseudo="${req.body.pseudo}"`;
    connection.query(sql, (error, results, fields) => {
        
        if (results.length == 0 || error) {
            res.status(400).json({message: "Ce pseudo ou cet email ne sont pas valides"})
        }
        else if(results.length == 1){ /* Demande une auth du mot de passe pour valider la suppression */
            
            bcrypt.compare(req.body.password, results[0].password)
            .then(valid => {
                if (!valid){
                return res.status(400).json({message: "Ce mot de passe n'est pas valide"})
                }
                const sql = `DELETE FROM users WHERE email="${buffer}" AND pseudo="${req.body.pseudo}"`;
                connection.query(sql, () => {
                    return res.status(200).json({message: "Votre compte est supprimé"})   
                });
            })
            .catch(() => res.status(500).json({message: "erreur login"}))
        }      
    });
}


