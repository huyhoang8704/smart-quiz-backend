pipeline {
    agent any
    triggers {
        githubPush()
    }
    tools {
        nodejs "NodeJS-18"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/huyhoang8704/smart-quiz-backend.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npm test'
            }
        }

        // stage('Build') {
        //     steps {
        //         sh 'npm run build || echo "No build step defined"'
        //     }
        // }
    }

    post {
        always {
            echo 'Pipeline completed.'
        }
    }
}
