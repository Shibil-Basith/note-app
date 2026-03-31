pipeline {
    agent any
    environment {
        IMAGE_NAME = "shibilbasithcp/noteapp"
        IMAGE_TAG  = "build-${env.BUILD_NUMBER}"
    }
    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }
        stage('Clone Repo') {
            steps {
                git branch: 'main', url: 'https://github.com/Shibil-Basith/note-app.git'
            }
        }
        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -t ${IMAGE_NAME}:latest ."
            }
        }
        stage('Login to DockerHub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'USER',
                    passwordVariable: 'PASS'
                )]) {
                    sh 'echo $PASS | docker login -u $USER --password-stdin'
                }
            }
        }
        stage('Push Image') {
            steps {
                sh "docker push ${IMAGE_NAME}:${IMAGE_TAG}"
                sh "docker push ${IMAGE_NAME}:latest"
            }
        }
        stage('Deploy (ASG Refresh)') {
            steps {
                sh '''
                aws autoscaling start-instance-refresh \
                  --auto-scaling-group-name noteapp-server-asg \
                  --region ap-south-1
                '''
            }
        }
    }
    post {
        always {
            sh "docker rmi ${IMAGE_NAME}:${IMAGE_TAG} || true"
            sh "docker rmi ${IMAGE_NAME}:latest || true"
            sh 'docker logout'
        }
        failure {
            echo 'Pipeline failed — check logs above.'
        }
    }
}
