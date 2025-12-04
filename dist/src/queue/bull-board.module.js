"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BullBoardConfigModule = void 0;
const common_1 = require("@nestjs/common");
const nestjs_1 = require("@bull-board/nestjs");
const express_1 = require("@bull-board/express");
const bullAdapter_1 = require("@bull-board/api/bullAdapter");
let BullBoardConfigModule = class BullBoardConfigModule {
};
exports.BullBoardConfigModule = BullBoardConfigModule;
exports.BullBoardConfigModule = BullBoardConfigModule = __decorate([
    (0, common_1.Module)({
        imports: [
            nestjs_1.BullBoardModule.forRoot({
                route: '/admin/queues',
                adapter: express_1.ExpressAdapter,
            }),
            nestjs_1.BullBoardModule.forFeature({
                name: 'merge-queue',
                adapter: bullAdapter_1.BullAdapter,
            }),
        ],
    })
], BullBoardConfigModule);
//# sourceMappingURL=bull-board.module.js.map