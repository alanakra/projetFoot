const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const jwt = require('jsonwebtoken');

const db = require('../config/db.config.js');

const userMiddleware = require('../middleware/users.js');

router.post('/sign-up', userMiddleware.validateRegister, (req, res, next) => {
    db.query(
        `SELECT * FROM users WHERE LOWER(username) = LOWER(${db.escape(req.body.username)});`,
        (err, result) => {
            if (result.length) {
                return res.status(409).send({
                    msg: 'This username is already in use!'
                });
            } else {
                // username is available
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if (err) {
                        return res.status(500).send({
                            msg: err
                        });
                    } else {
                        // has hashed pw => add to database
                        db.query(
                            `INSERT INTO users (id, username, password, registered) VALUES ('${uuid.v4()}', ${db.escape(req.body.username)}, ${db.escape(hash)}, now())`,
                            (err, result) => {
                                if (err) {
                                    throw err;
                                    return res.status(400).send({
                                        msg: err
                                    });
                                }
                                return res.status(201).send({
                                    msg: 'Registered!'
                                });
                            }
                        );
                    }
                });
            }
        }
    );
});

router.post('/login', (req, res, next) => {
    db.query(
        `SELECT * FROM users WHERE username = ${db.escape(req.body.username)};`,
        (err, result) => {
            // user does not exists
            if (err) {
                throw err;
                return res.status(400).send({
                    msg: err
                });
            }
            if (!result.length) {
                return res.status(401).send({
                    msg: 'Username or password is incorrect!'
                });
            }
            // check password
            bcrypt.compare(
                req.body.password,
                result[0]['password'],
                (bErr, bResult) => {
                    // wrong password
                    if (bErr) {
                        throw bErr;
                        return res.status(401).send({
                            msg: 'Username or password is incorrect!'
                        });
                    }
                    if (bResult) {
                        const token = jwt.sign({
                                username: result[0].username,
                                userId: result[0].id
                            },
                            'SECRETKEY', {
                                expiresIn: '7d'
                            }
                        );
                        return res.status(200).send({
                            msg: 'Logged in!',
                            token,
                            user: result[0]
                        });
                    }
                    return res.status(401).send({
                        msg: 'Username or password is incorrect!'
                    });
                }
            );
        }
    );
});

router.get('/secret-route', userMiddleware.isLoggedIn, (req, res, next) => {
    console.log(req.userData);
    res.send('This is the secret content. Only logged in users can see that!');
});

router.get('/article', (req, res) => {
    db.query(
        `SELECT * FROM article`, (err, rows, fields) => {
            if(!err){
                res.send(rows);
            } else {
                console.log(err);
            }
        })
});

router.post('/articleAdd', userMiddleware.validateAdd, (req, res, next) => {
    db.query(
        `INSERT INTO article (id, title, images, description) VALUES (${db.escape(req.body.id)},${db.escape(req.body.title)} ,${db.escape(req.body.images)}, ${db.escape(req.body.description)});`,
        (err, result) => {
            if (err) {
                throw err;
                return res.status(400).send({
                    msg: err
                });
            }
            return res.status(201).send({
                msg: 'Inserted!'
            });
        }
    );
});

router.put('/articleUpdate', userMiddleware.validateAdd, (req, res, next) => {
    db.query(
        `UPDATE article set title = ${db.escape(req.body.title)}, description = ${db.escape(req.body.title)} where id = ${db.escape(req.body.id)};`,
        (err, result) => {
            if (err) {
                throw err;
                return res.status(400).send({
                    msg: err
                });
            }
            return res.status(201).send({
                msg: 'Updated!'
            });
        }
    );
});

router.delete('/article/:id', (req, res, next) => {
    db.query(
        `DELETE From article where id = ${db.escape(req.params.id)};`,
        (err, result) => {
            if (err) {
                throw err;
                return res.status(400).send({
                    msg: err
                });
            }
            return res.status(201).send({
                msg: 'Deleted!'
            });
        }
    );
});


router.get('/product', (req, res) => {
    db.query(
        `SELECT * FROM product`, (err, rows, fields)=>{
            if(!err){
                res.send(rows);
            } else {
                console.log(err);
            }
        })
});

router.post('/productAdd', userMiddleware.validateAddProduct, (req, res, next) => {
    db.query(
        `INSERT INTO product (id, nomproduit, prix, image, descriptions) VALUES (${db.escape(req.body.id)}, ${db.escape(req.body.nomproduit)}, ${db.escape(req.body.prix)}, ${db.escape(req.body.image)}, ${db.escape(req.body.descriptions)});`,
        (err, result) => {
            if (err) {
                throw err;
                return res.status(400).send({
                    msg: err
                });
            }
            return res.status(201).send({
                msg: 'Inserted!'
            });
        }
    );
});

router.put('/productUpdate', userMiddleware.validateAdd, (req, res, next) => {
    db.query(
        `UPDATE product set nomproduit = ${db.escape(req.body.nomproduit)}, prix = ${db.escape(req.body.prix)}, descriptions = ${db.escape(req.body.descriptions)}  where id = ${db.escape(req.body.id)};`,
        (err, result) => {
            if (err) {
                throw err;
                return res.status(400).send({
                    msg: err
                });
            }
            return res.status(201).send({
                msg: 'Updated!'
            });
        }
    );
});

router.delete('/product/:id', (req, res, next) => {
    db.query(
        `DELETE From product where id = ${db.escape(req.body.id)};`,
        (err, result) => {
            if (err) {
                throw err;
                return res.status(400).send({
                    msg: err
                });
            }
            return res.status(201).send({
                msg: 'Deleted!'
            });
        }
    );
});

module.exports = router;