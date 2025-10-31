#프로젝트 테스트 할때 실행 방법

1. ai 디렉토리에서 uvicorn main:app --reload --host 0.0.0.0 --port 8000 실행
2. back 디렉토리에서 ./gradlew bootrun실행
3. ui 디렉토리에서 npm start 실행 
(db 세팅 등과 관련해서 .env파일 필요. 해당 파일은 깃허브에 업로드 x, .env파일에 업데이트 있을 경우 개별적으로 공유)

#프로젝트 시연할 때 docker-compose로 back,ui동시에 실행(시간 오래 걸림. 프로젝트 테스트 할 때는 비추)

루트 디렉토리에서 docker-compose up --build
