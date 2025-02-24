import { ErrorType } from '@common/enums';
import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

export class FileStorageConfig {
    private readonly maxFileSize: number;
    private readonly allowedMimeTypes: string[];

    constructor(
        maxFileSizeMB: number = 5,
        allowedMimeTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg']
    ) {
        this.maxFileSize = maxFileSizeMB * 1024 * 1024; // Convert MB to bytes
        this.allowedMimeTypes = allowedMimeTypes;
    }

    public getMulterOptions = (acceptedFilenames: string[] = []): MulterOptions => ({
        storage: memoryStorage(),
        limits: { fileSize: this.maxFileSize },
        fileFilter: (req, file, callback) => {
            if (!acceptedFilenames.includes(file?.fieldname)) {
                return callback(null, true);
            }
            if (this.allowedMimeTypes.includes(file?.mimetype)) {
                return callback(null, true);
            } else {
                return callback(new BadRequestException(ErrorType.InternalErrorServer), false);
            }
        },
    });

    public getMaxFileSizeMB(): number {
        return this.maxFileSize / (1024 * 1024);
    }
}
