import express from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import aws from 'aws-sdk';
import path from 'path';
import 'express-async-errors';
import { body } from 'express-validator';
import { validate } from '../middleware/validator.js'
import { isAuth } from '../middleware/auth.js';
import * as boardController from '../controller/board.controller.js';

const __dirname = path.resolve();
const router = express.Router();
aws.config.loadFromPath(__dirname + '/awsconfig.json');

const s3 = new aws.S3();
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "./uploads/");
	},
	filename: (req, file, cb) => {
		cb(null, `${Date.now()}_${file.originalname}`)
	},
});

const fileSizeLimitErrorHandler = (err, req, res, next) => {
	if (err) {
		res.status(400).send({message: "파일의 크기가 너무 큽니다"});
	} else {
	  next()
	}
  }

const fileFilter = (req, file, cb) => {
    // mime type 체크하여 이미지만 필터링
    if (file.mimetype == 'image/jpeg' || file.mimetype == 'image/png'||file.mimetype == 'image/jpg') {
        req.fileValidationError = null;
		cb(null, true);
    } else {
		req.fileValidationError = "jpeg, jpg, png 파일만 업로드 가능합니다.";
        cb(null, false);
    }
}

const upload2 = multer({ 
	storage: storage,
	fileFilter: fileFilter,
	limits: {
		fileSize: 10 * 1024 * 1024 
	},	
});

const upload = multer({ 
	storage: multerS3({
		s3: s3,
		bucket: 'together42',
		acl: 'public-read',
		key: function(req, file, cb){
			cb(null, `uploads/${Date.now()}_${file.originalname}`);
		}
	}),
	fileFilter:fileFilter,
	limits: {
		fileSize: 10 * 1024 * 1024
	}

},'NONE');

////게시글 전체조회
router.get('/',boardController.getBoardList);

//게시글 생성
router.post('/', isAuth ,boardController.createPost);

//게시글 삭제
router.delete('/:id', isAuth ,boardController.deletePost);

//게시글 수정
router.put('/:id', isAuth ,boardController.updatePost);

////게시글 상세조회
router.get('/:id',boardController.getBoardDetail);

//댓글 생성
router.post('/comment', isAuth, boardController.createComment);

//댓글 수정
router.put('/comment/:id', isAuth, boardController.updateComment);

//댓글 삭제
router.delete('/comment/:id', isAuth, boardController.deleteComment);

//사진 업로드
router.post('/upload', upload.array("image",8), fileSizeLimitErrorHandler, boardController.upload);


export default router;